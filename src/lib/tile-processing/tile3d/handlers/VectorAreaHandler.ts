import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import Tile3DExtrudedGeometryBuilder, {
	RoofType
} from "~/lib/tile-processing/tile3d/builders/Tile3DExtrudedGeometryBuilder";
import Vec2 from "~/lib/math/Vec2";
import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import Tile3DProjectedGeometryBuilder from "~/lib/tile-processing/tile3d/builders/Tile3DProjectedGeometryBuilder";
import Tile3DProjectedGeometry, {ZIndexMap} from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DLabel from "~/lib/tile-processing/tile3d/features/Tile3DLabel";
import Tile3DMultipolygon, {OMBBResult} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Config from "~/app/Config";
import Tile3DInstance, {Tile3DInstanceType} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import Vec3 from "~/lib/math/Vec3";
import SeededRandom from "~/lib/math/SeededRandom";
import RoadGraph from "~/lib/road-graph/RoadGraph";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {
	getTreeHeightRangeFromTextureId,
	getTreeTextureIdFromType,
	getTreeTextureScaling
} from "~/lib/tile-processing/tile3d/utils";
import {ExtrudedTextures, ProjectedTextures} from "~/lib/tile-processing/tile3d/textures";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import * as Simplify from "simplify-js";
import {SurfaceBuilderOrientation} from "~/lib/tile-processing/tile3d/builders/SurfaceBuilder";
import DominicaBuildingDataLoader, {DominicaBuildingMatch} from "~/app/data/DominicaBuildingDataLoader";
import BuildingLODSystem from "~/app/systems/BuildingLODSystem";

const TileSize = 611.4962158203125;

export default class VectorAreaHandler implements Handler {
	// GeoTwin: Dominica building data loader (shared across all instances)
	private static dominicaDataLoader: DominicaBuildingDataLoader | null = null;

	public static async initializeDominicaData(geoJsonSource: string | object): Promise<void> {
		if (!VectorAreaHandler.dominicaDataLoader) {
			VectorAreaHandler.dominicaDataLoader = new DominicaBuildingDataLoader();
			await VectorAreaHandler.dominicaDataLoader.loadGeoJSONData(geoJsonSource);
		}
	}

	public static getDominicaDataLoader(): DominicaBuildingDataLoader | null {
		return VectorAreaHandler.dominicaDataLoader;
	}
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorAreaDescriptor;
	private readonly rings: VectorAreaRing[];
	private mercatorScale: number = 1;
	private terrainMinHeight: number = 0;
	private terrainMaxHeight: number = 0;
	private multipolygon: Tile3DMultipolygon = null;
	private instances: Tile3DInstance[] = [];

	public constructor(feature: VectorArea) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.rings = feature.rings;

		this.simplify();
	}

	private simplify(): void {
		if (this.descriptor.type === 'roadwayIntersection' || this.descriptor.type === 'building') {
			return;
		}

		const multipolygon = this.getMultipolygon();
		const initialArea = multipolygon.getArea();

		if (initialArea < 5) {
			return;
		}

		for (const ring of this.rings) {
			ring.nodes = VectorAreaHandler.simplifyNodes(ring.nodes);
		}

		this.multipolygon = null;
	}

	public setRoadGraph(graph: RoadGraph): void {

	}

	public setMercatorScale(scale: number): void {
		this.mercatorScale = scale;
	}

	private getMultipolygon(): Tile3DMultipolygon {
		if (this.multipolygon === null) {
			this.multipolygon = new Tile3DMultipolygon();

			for (const ring of this.rings) {
				const type = ring.type === VectorAreaRingType.Inner ? Tile3DRingType.Inner : Tile3DRingType.Outer;
				const nodes = ring.nodes.map(node => new Vec2(node.x, node.y));

				this.multipolygon.addRing(new Tile3DRing(type, nodes));
			}

			if (this.descriptor.ombb) {
				this.multipolygon.setOMBB(this.descriptor.ombb);
			}

			if (this.descriptor.poi) {
				this.multipolygon.setPoleOfInaccessibility(this.descriptor.poi);
			}
		}

		return this.multipolygon;
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		if (this.descriptor.type === 'building' || this.descriptor.type === 'buildingPart') {
			const positions: number[] = [];

			for (const ring of this.rings) {
				for (const vertex of ring.nodes) {
					positions.push(vertex.x, vertex.y);
				}
			}

			return {
				positions: new Float64Array(positions),
				callback: (heights: Float64Array): void => {
					let minHeight = Infinity;
					let maxHeight = -Infinity;

					for (let i = 0; i < heights.length; i++) {
						minHeight = Math.min(minHeight, heights[i]);
						maxHeight = Math.max(maxHeight, heights[i]);
					}

					this.terrainMinHeight = minHeight;
					this.terrainMaxHeight = maxHeight;
				}
			};
		}

		if (this.descriptor.type === 'forest') {
			const points2D = this.getMultipolygon().populateWithPoints(
				Math.floor(40 / this.mercatorScale),
				Config.TileSize
			);
			const points3D: Vec3[] = [];
			const positions: number[] = [];

			for (const point of points2D) {
				if (point.x < 0 || point.y < 0 || point.x > TileSize || point.y > TileSize) {
					continue;
				}

				positions.push(point.x, point.y);
				points3D.push(new Vec3(point.x, 0, point.y));
			}

			return {
				positions: new Float64Array(positions),
				callback: (heights: Float64Array): void => {
					for (let i = 0; i < points3D.length; i++) {
						const x = points3D[i].x;
						const y = heights[i];
						const z = points3D[i].z;

						this.instances.push(this.createTree(x, y, z));
					}
				}
			};
		}

		if (this.descriptor.type === 'shrubbery') {
			const points2D = this.getMultipolygon().populateWithPoints(
				Math.floor(80 / this.mercatorScale),
				Config.TileSize
			);
			const points3D: Vec3[] = [];
			const positions: number[] = [];

			for (const point of points2D) {
				if (point.x < 0 || point.y < 0 || point.x > TileSize || point.y > TileSize) {
					continue;
				}

				positions.push(point.x, point.y);
				points3D.push(new Vec3(point.x, 0, point.y));
			}

			return {
				positions: new Float64Array(positions),
				callback: (heights: Float64Array): void => {
					for (let i = 0; i < points3D.length; i++) {
						const x = points3D[i].x;
						const y = heights[i];
						const z = points3D[i].z;

						this.instances.push(this.createShrub(x, y, z));
					}
				}
			};
		}

		if (this.descriptor.type === 'construction') {
			const center = this.getMultipolygon().getPoleOfInaccessibility();

			if (center.x < 0 || center.y < 0 || center.x > TileSize || center.y > TileSize) {
				return null;
			}

			let instanceType: Tile3DInstanceType = null;

			if (center.z > 12 * this.mercatorScale) {
				instanceType = 'trackedCrane';
			}

			if (center.z > 32 * this.mercatorScale) {
				instanceType = 'towerCrane';
			}

			if (instanceType) {
				return {
					positions: new Float64Array([center.x, center.y]),
					callback: (heights: Float64Array): void => {
						const instance = this.createGenericInstance(center.x, heights[0], center.y, instanceType);
						this.instances.push(instance);
					}
				};
			}
		}

		return null;
	}

	public getFeatures(): Tile3DFeature[] {
		switch (this.descriptor.type) {
			case 'building':
			case 'buildingPart':
				return this.handleBuilding();
			case 'water': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Water,
					isOriented: false,
					zIndex: ZIndexMap.Water
				});
			}
			case 'pitch': {
				const textureIdMap = {
					football: ProjectedTextures.FootballPitch,
					basketball: ProjectedTextures.BasketballPitch,
					tennis: ProjectedTextures.TennisCourt,
					generic: ProjectedTextures.GenericPitch
				};
				const textureId = textureIdMap[this.descriptor.pitchType];

				if (textureId === ProjectedTextures.GenericPitch) {
					return this.handleGenericSurface({
						textureId,
						isOriented: false,
						uvScale: 20,
						zIndex: ZIndexMap.Pitch
					});
				}

				return this.handleGenericSurface({
					textureId,
					isOriented: true,
					stretch: true,
					zIndex: ZIndexMap.Pitch
				});
			}
			case 'manicuredGrass': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.ManicuredGrass,
					isOriented: false,
					zIndex: ZIndexMap.ManicuredGrass,
					uvScale: 20,
				});
			}
			case 'garden': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Garden,
					isOriented: false,
					zIndex: ZIndexMap.Garden,
					uvScale: 16,
				});
			}
			case 'construction': {
				const features: Tile3DFeature[] = this.handleGenericSurface({
					textureId: ProjectedTextures.Soil,
					isOriented: false,
					zIndex: ZIndexMap.Construction,
					uvScale: 25,
				});

				features.push(...this.instances);

				return features;
			}
			case 'buildingConstruction': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Soil,
					isOriented: false,
					zIndex: ZIndexMap.Construction,
					uvScale: 25,
				});
			}
			case 'grass': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Grass,
					isOriented: false,
					zIndex: ZIndexMap.Grass,
					uvScale: 25,
				});
			}
			case 'rock': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Rock,
					isOriented: false,
					zIndex: ZIndexMap.Rock,
					uvScale: 32,
				});
			}
			case 'sand': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Sand,
					isOriented: false,
					zIndex: ZIndexMap.Sand,
					uvScale: 12,
				});
			}
			case 'farmland': {
				const rnd = new SeededRandom(this.osmReference.id);
				const textureCount = 3;
				const texture = Math.floor(rnd.generate() * textureCount);

				return this.handleGenericSurface({
					textureId: ProjectedTextures.Farmland0 + texture,
					isOriented: true,
					stretch: false,
					orientation: SurfaceBuilderOrientation.Across,
					zIndex: ZIndexMap.Farmland,
					uvScale: 50
				});
			}
			case 'asphalt': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Asphalt,
					isOriented: false,
					zIndex: ZIndexMap.AsphaltArea,
					uvScale: 20,
					addUsageMask: true,
				});
			}
			case 'roadwayArea': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Asphalt,
					isOriented: false,
					zIndex: ZIndexMap.RoadwayArea,
					uvScale: 20,
					addUsageMask: true,
				});
			}
			case 'roadwayIntersection': {
				return this.handleRoadIntersection();
			}
			case 'pavement': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Pavement,
					isOriented: false,
					zIndex: ZIndexMap.FootwayArea,
					uvScale: 10,
				});
			}
			case 'helipad': {
				return [
					...this.handleGenericSurface({
						textureId: ProjectedTextures.Helipad,
						isOriented: true,
						stretch: true,
						zIndex: ZIndexMap.Helipad
					}),
					...this.handleGenericSurface({
						textureId: ProjectedTextures.Pavement,
						isOriented: false,
						zIndex: ZIndexMap.FootwayArea,
						uvScale: 10,
					})
				];
			}
			case 'forest': {
				return [
					...this.instances,
					...this.handleGenericSurface({
						textureId: ProjectedTextures.Grass, // Use lighter green grass texture instead of dark ForestFloor
						isOriented: false,
						zIndex: ZIndexMap.Farmland, // Use farmland z-index (7) to render above base terrain
						uvScale: 20, // Slightly different scale than scrub
					})
				];
			}


			case 'shrubbery': {
				return [
					...this.instances,
					...this.handleGenericSurface({
						textureId: ProjectedTextures.ForestFloor,
						isOriented: false,
						zIndex: ZIndexMap.ShrubberySoil,
						uvScale: 15,
					})
				];
			}
		}

		return [];
	}

	private handleRoadIntersection(): Tile3DFeature[] {
		const params: Record<
			VectorAreaDescriptor['intersectionMaterial'],
			{textureId: number; scale: number}
		> = {
			asphalt: {textureId: ProjectedTextures.Asphalt, scale: 20},
			concrete: {textureId: ProjectedTextures.ConcreteIntersection, scale: 20},
			cobblestone: {textureId: ProjectedTextures.Cobblestone, scale: 6},
		};

		const {textureId, scale} = params[this.descriptor.intersectionMaterial] ?? params.asphalt;

		return this.handleGenericSurface({
			textureId: textureId,
			isOriented: false,
			zIndex: ZIndexMap.AsphaltArea,
			uvScale: scale,
			addUsageMask: true
		});
	}

	private handleBuilding(): Tile3DFeature[] {
		const multipolygon = this.getMultipolygon();
		const builder = new Tile3DExtrudedGeometryBuilder(this.osmReference, multipolygon);

		const noDefaultRoof = builder.getAreaToOMBBRatio() < 0.75 || multipolygon.getArea() < 10;
		const roofParams = this.getRoofParams(noDefaultRoof);

		const facadeMinHeight = this.descriptor.buildingFoundation ? this.terrainMaxHeight : this.terrainMinHeight;
		const foundationHeight = this.terrainMaxHeight - this.terrainMinHeight;

		// GeoTwin: Apply height multiplier for different roof shapes
		const adjustedRoofHeight = this.descriptor.buildingRoofHeight * (roofParams.heightMultiplier || 1.0);

		const {skirt, facadeHeightOverride} = builder.addRoof({
			terrainHeight: facadeMinHeight,
			type: roofParams.type,
			buildingHeight: this.descriptor.buildingHeight,
			minHeight: this.descriptor.buildingHeight - adjustedRoofHeight,
			height: adjustedRoofHeight,
			direction: this.descriptor.buildingRoofDirection,
			orientation: this.descriptor.buildingRoofOrientation,
			angle: this.descriptor.buildingRoofAngle,
			textureId: roofParams.textureId,
			color: roofParams.color,
			scaleX: roofParams.scaleX,
			scaleY: roofParams.scaleY,
			isStretched: roofParams.isStretched,
			flip: false
		});

		const facadeParams = this.getFacadeParams();

		builder.addWalls({
			terrainHeight: facadeMinHeight,
			levels: this.descriptor.buildingLevels,
			windowWidth: facadeParams.windowWidth,
			minHeight: this.descriptor.buildingMinHeight,
			height: facadeHeightOverride ?? (this.descriptor.buildingHeight - this.descriptor.buildingRoofHeight),
			skirt: skirt,
			color: facadeParams.color,
			textureIdWall: facadeParams.textureIdWall,
			textureIdWindow: facadeParams.textureIdWindow,
			windowSeed: this.osmReference.id
		});

		if (this.descriptor.buildingFoundation && foundationHeight > 0.5) {
			builder.addWalls({
				terrainHeight: this.terrainMinHeight,
				levels: foundationHeight / 4,
				windowWidth: facadeParams.windowWidth,
				minHeight: 0,
				height: this.terrainMaxHeight - this.terrainMinHeight,
				skirt: null,
				color: facadeParams.color,
				textureIdWall: facadeParams.textureIdWall,
				textureIdWindow: facadeParams.textureIdWall,
				windowSeed: this.osmReference.id
			});
		}

		const features: Tile3DFeature[] = [
			builder.getGeometry(),
			builder.getTerrainMaskGeometry()
		];

		if (this.descriptor.label) {
			const pole = this.getMultipolygon().getPoleOfInaccessibility();
			const height = facadeMinHeight + this.descriptor.buildingHeight + 5;
			const labelFeature: Tile3DLabel = {
				type: 'label',
				position: [pole.x, height, pole.y],
				priority: pole.z,
				text: this.descriptor.label
			};

			features.push(labelFeature);
		}

		return features;
	}

	private handleGenericSurface(
		{
			textureId,
			isOriented,
			uvScale = 1,
			stretch = false,
			orientation = SurfaceBuilderOrientation.Along,
			zIndex,
			addUsageMask = false
		}: {
			textureId: number;
			isOriented: boolean;
			uvScale?: number;
			stretch?: boolean;
			orientation?: SurfaceBuilderOrientation;
			zIndex: number;
			addUsageMask?: boolean;
		}
	): Tile3DFeature[] {
		const builder = new Tile3DProjectedGeometryBuilder(this.getMultipolygon());
		builder.setZIndex(zIndex);

		builder.addPolygon({
			height: 0,
			textureId: textureId,
			isOriented: isOriented,
			orientation: orientation,
			stretch: stretch,
			uvScale: uvScale,
			addUsageMask: addUsageMask
		});

		const features: Tile3DFeature[] = [builder.getGeometry()];

		if (addUsageMask) {
			features.push(builder.getTerrainMaskGeometry());
		}

		return features;
	}

	private createTree(x: number, y: number, z: number): Tile3DInstance {
		const seed = Math.floor(x) + Math.floor(z);
		const rnd = new SeededRandom(seed);

		const rotation = rnd.generate() * Math.PI * 2;

		const textureIdList = getTreeTextureIdFromType(this.descriptor.treeType);
		const textureId = textureIdList[Math.floor(rnd.generate() * textureIdList.length)];
		const textureScale = getTreeTextureScaling(textureId);

		const heightRange = getTreeHeightRangeFromTextureId(textureId);
		const height = heightRange[0] + rnd.generate() * (heightRange[1] - heightRange[0]);

		return {
			type: 'instance',
			instanceType: 'tree',
			x: x,
			y: y * this.mercatorScale,
			z: z,
			scale: height * textureScale * this.mercatorScale,
			rotation: rotation,
			seed: rnd.generate(),
			textureId: textureId
		};
	}


	private createShrub(x: number, y: number, z: number): Tile3DInstance {
		const seed = Math.floor(x) + Math.floor(z);
		const rnd = new SeededRandom(seed);

		const height = 0.9 + rnd.generate() * 0.25;
		const rotation = rnd.generate() * Math.PI * 2;

		return {
			type: 'instance',
			instanceType: 'shrubbery',
			x: x,
			y: y * this.mercatorScale,
			z: z,
			scale: height * this.mercatorScale,
			rotation: rotation
		};
	}

	private createGenericInstance(x: number, y: number, z: number, type: Tile3DInstanceType): Tile3DInstance {
		const seed = Math.floor(x) + Math.floor(z);
		const rnd = new SeededRandom(seed);

		const rotation = rnd.generate() * Math.PI * 2;

		return {
			type: 'instance',
			instanceType: type,
			x: x,
			y: y * this.mercatorScale,
			z: z,
			scale: this.mercatorScale,
			rotation: rotation
		};
	}

	private static getRoofTypeFromString(str: VectorAreaDescriptor['buildingRoofType']): RoofType {
		switch (str) {
			case 'flat':
				return RoofType.Flat;
			case 'gabled':
				return RoofType.Gabled;
			case 'gambrel':
				return RoofType.Gambrel;
			case 'hipped':
				return RoofType.Hipped;
			case 'pyramidal':
				return RoofType.Pyramidal;
			case 'onion':
				return RoofType.Onion;
			case 'dome':
				return RoofType.Dome;
			case 'round':
				return RoofType.Round;
			case 'skillion':
				return RoofType.Skillion;
			case 'mansard':
				return RoofType.Mansard;
			case 'quadrupleSaltbox':
				return RoofType.QuadrupleSaltbox;
			case 'saltbox':
				return RoofType.Saltbox;
		}

		console.error(`Roof type ${str} is not supported`);

		return RoofType.Flat;
	}

	private getRoofParams(noDefaultRoof: boolean): {
		type: RoofType;
		textureId: number;
		color: number;
		scaleX: number;
		scaleY: number;
		isStretched: boolean;
		heightMultiplier?: number;
	} {
		// GeoTwin: Get LOD from worker instance
		const currentLOD = (globalThis as any).WorkerInstance?.getCurrentBuildingLOD?.() || 'lod3';

		// LOD 1: Simple white blocks - force flat roof and white color
		if (currentLOD === 'lod1') {
			return {
				type: RoofType.Flat,
				textureId: ExtrudedTextures.RoofConcrete,
				color: 0xFFFFFF, // Pure white
				scaleX: 1,
				scaleY: 1,
				isStretched: true,
				heightMultiplier: 1.0
			};
		}

		// LOD 2 & 3: Continue with original roof logic
		const roofType = VectorAreaHandler.getRoofTypeFromString(this.descriptor.buildingRoofType);
		let roofMaterial = this.descriptor.buildingRoofMaterial;
		let roofColor = this.descriptor.buildingRoofColor;

		// LOD 2: Keep all roof details (same as LOD 3)
		// No changes needed - use original roof logic

		// GeoTwin: Try to get Dominica building data first
		const dominicaData = this.getDominicaBuildingData();
		if (dominicaData && dominicaData.confidence > 0.7) {
			// High confidence match - use Dominica data
			if (dominicaData.roofMaterial !== 'default') {
				roofMaterial = dominicaData.roofMaterial;
			}
			if (dominicaData.roofColor) {
				roofColor = dominicaData.roofColor;
			}
			// Override roof shape if specified in Dominica data
			if (dominicaData.roofShape !== 'default' && roofType === RoofType.Flat && roofMaterial === 'default') {
				const dominicaRoofType = this.mapDominicaRoofShape(dominicaData.roofShape);
				return this.createRoofParamsFromDominicaData(dominicaData, dominicaRoofType);
			}
		}

		const materialToTextureId: Record<VectorAreaDescriptor['buildingRoofMaterial'], number> = {
			default: ExtrudedTextures.RoofConcrete,
			tiles: ExtrudedTextures.RoofTiles,
			metal: ExtrudedTextures.RoofMetal,
			concrete: ExtrudedTextures.RoofConcrete,
			thatch: ExtrudedTextures.RoofThatch,
			eternit: ExtrudedTextures.RoofEternit,
			grass: ExtrudedTextures.RoofGrass,
			glass: ExtrudedTextures.RoofGlass,
			tar: ExtrudedTextures.RoofTar
		};
		const textureIdToScale: Record<number, Vec2> = {
			[ExtrudedTextures.RoofTiles]: new Vec2(3, 3),
			[ExtrudedTextures.RoofMetal]: new Vec2(4, 4),
			[ExtrudedTextures.RoofConcrete]: new Vec2(10, 10),
			[ExtrudedTextures.RoofThatch]: new Vec2(8, 8),
			[ExtrudedTextures.RoofEternit]: new Vec2(5, 5),
			[ExtrudedTextures.RoofGrass]: new Vec2(12, 12),
			[ExtrudedTextures.RoofGlass]: new Vec2(4, 4),
			[ExtrudedTextures.RoofTar]: new Vec2(4, 4),
		};

		// GeoTwin: Replace generic roof textures with varied roof shapes
		if (roofType === RoofType.Flat && roofMaterial === 'default' && !noDefaultRoof) {
			// Cycle through different roof shapes instead of using generic textures
			const roofShapes = [
				{ type: RoofType.Gabled, textureId: ExtrudedTextures.RoofConcrete, heightMultiplier: 1.3 },    
				{ type: RoofType.Hipped, textureId: ExtrudedTextures.RoofConcrete, heightMultiplier: 1.2 },    
				{ type: RoofType.Flat, textureId: ExtrudedTextures.RoofConcrete, heightMultiplier: 1.0 },      
				{ type: RoofType.Pyramidal, textureId: ExtrudedTextures.RoofConcrete, heightMultiplier: 1.25 } 
			];

			// Randomize roof colors for default buildings
			const roofColors = [
				0xA52A2A, 
  				0x8B0000, 
				0xB22222, 
  				0x808080, 
  				0x005500, 
				0x000077, 
				0x556b66, 
				0xC0C0C0  
			];

			const buildingId = this.osmReference.id || 0;
			const selectedRoof = roofShapes[buildingId % roofShapes.length];
			const selectedColor = roofColors[buildingId % roofColors.length];

			// GeoTwin: Debug logging for roof shape randomization (uncomment for debugging)
			// console.log(`GeoTwin: Building ${buildingId} assigned roof: ${RoofType[selectedRoof.type]}, color: ${selectedColor.toString(16)}, height: ${selectedRoof.heightMultiplier}x`);

			return {
				type: selectedRoof.type,
				textureId: selectedRoof.textureId,
				color: selectedColor,
				scaleX: 1,
				scaleY: 1,
				isStretched: true,
				heightMultiplier: selectedRoof.heightMultiplier
			};
		}

		if (noDefaultRoof && roofMaterial === 'default') {
			roofColor = 0xBBBBBB;
		}

		const id = materialToTextureId[roofMaterial];
		const scale = textureIdToScale[id] ?? new Vec2(1, 1);

		return {
			type: roofType,
			textureId: id,
			color: roofColor,
			scaleX: scale.x,
			scaleY: scale.y,
			isStretched: false,
			heightMultiplier: 1.0 // Default height multiplier for specific roof materials
		};
	}

	// GeoTwin: Helper methods for Dominica data integration
	private getDominicaBuildingData(): DominicaBuildingMatch | null {
		const dataLoader = VectorAreaHandler.getDominicaDataLoader();
		if (!dataLoader || !dataLoader.isDataLoaded()) {
			return null;
		}

		// Get building center coordinates
		const multipolygon = this.getMultipolygon();
		const center = multipolygon.getPoleOfInaccessibility();

		// Convert tile coordinates to WGS84 (longitude, latitude)
		// This is a simplified conversion - you may need to adjust based on your tile coordinate system
		const wgs84Coordinates: [number, number] = this.convertTileToWGS84(center.x, center.y);

		return dataLoader.getBuildingInfo(wgs84Coordinates);
	}

	private convertTileToWGS84(tileX: number, tileY: number): [number, number] {
		// For now, we'll use a simplified approach and rely on OSM coordinate extraction
		// This could be enhanced with proper tile-to-WGS84 coordinate transformation

		// Dominica bounds: longitude -61.6 to -61.2, latitude 15.2 to 15.7
		// Basic bounds check to see if coordinates are already in WGS84
		if (tileX >= -61.6 && tileX <= -61.2 && tileY >= 15.2 && tileY <= 15.7) {
			return [tileX, tileY];
		}

		// If coordinates are outside Dominica bounds, they're likely in a different system
		// For now, return null to fall back to OSM coordinate extraction
		return [0, 0]; // This will be filtered out
	}

	private mapDominicaRoofShape(roofShape: string): RoofType {
		switch (roofShape.toLowerCase()) {
			case 'flat': return RoofType.Flat;
			case 'gabled': return RoofType.Gabled;
			case 'hipped': return RoofType.Hipped;
			case 'pyramidal': return RoofType.Pyramidal;
			default: return RoofType.Flat;
		}
	}

	private createRoofParamsFromDominicaData(dominicaData: DominicaBuildingMatch, roofType: RoofType): {
		type: RoofType;
		textureId: number;
		color: number;
		scaleX: number;
		scaleY: number;
		isStretched: boolean;
		heightMultiplier?: number;
	} {
		// Map Dominica roof material to texture ID
		const materialToTextureId: Record<string, number> = {
			concrete: ExtrudedTextures.RoofConcrete,
			metal: ExtrudedTextures.RoofMetal,
			tiles: ExtrudedTextures.RoofTiles,
			thatch: ExtrudedTextures.RoofThatch,
			default: ExtrudedTextures.RoofConcrete
		};

		const textureId = materialToTextureId[dominicaData.roofMaterial] || ExtrudedTextures.RoofConcrete;
		const color = dominicaData.roofColor || 0x888888; // Default gray

		// Height multipliers based on roof type
		const heightMultipliers: Record<RoofType, number> = {
			[RoofType.Flat]: 1.0,
			[RoofType.Gabled]: 1.3,
			[RoofType.Hipped]: 1.2,
			[RoofType.Pyramidal]: 1.25,
			[RoofType.Gambrel]: 1.4,
			[RoofType.Dome]: 1.5,
			[RoofType.Round]: 1.3,
			[RoofType.Skillion]: 1.1,
			[RoofType.Mansard]: 1.4,
			[RoofType.QuadrupleSaltbox]: 1.3,
			[RoofType.Saltbox]: 1.2,
			[RoofType.Onion]: 1.6
		};

		return {
			type: roofType,
			textureId: textureId,
			color: color,
			scaleX: 1,
			scaleY: 1,
			isStretched: true,
			heightMultiplier: heightMultipliers[roofType] || 1.0
		};
	}

	private getFacadeParams(): {
		windowWidth: number;
		color: number;
		textureIdWindow: number;
		textureIdWall: number;
	} {
		// GeoTwin: Get LOD from worker instance
		const currentLOD = (globalThis as any).WorkerInstance?.getCurrentBuildingLOD?.() || 'lod3';

		const material = this.descriptor.buildingFacadeMaterial;
		let color = this.descriptor.buildingFacadeColor;
		const hasWindows = this.descriptor.buildingWindows;

		// LOD 1 & 2: Pure white facades - no windows
		if (currentLOD === 'lod1' || currentLOD === 'lod2') {
			return {
				windowWidth: 0, // No windows
				color: 0xFFFFFF, // Pure white
				textureIdWall: ExtrudedTextures.FacadePlasterWall,
				textureIdWindow: ExtrudedTextures.FacadePlasterWall
			};
		}

		// LOD 3: Original facade logic
		const materialToTextureId: Record<VectorAreaDescriptor['buildingFacadeMaterial'], {
			wall: number;
			window: number;
			width: number;
		}> = {
			plaster: {
				wall: ExtrudedTextures.FacadePlasterWall,
				window: ExtrudedTextures.FacadePlasterWindow,
				width: 4
			},
			glass: {
				wall: ExtrudedTextures.FacadeGlass,
				window: ExtrudedTextures.FacadeGlass,
				width: 4
			},
			brick: {
				wall: ExtrudedTextures.FacadeBrickWall,
				window: ExtrudedTextures.FacadeBrickWindow,
				width: 4
			},
			wood: {
				wall: ExtrudedTextures.FacadeWoodWall,
				window: ExtrudedTextures.FacadeWoodWindow,
				width: 4
			},
			cementBlock: {
				wall: ExtrudedTextures.FacadeBlockWall,
				window: ExtrudedTextures.FacadeBlockWindow,
				width: 4
			}
		};

		const params = materialToTextureId[material] ?? materialToTextureId.plaster;

		return {
			windowWidth: params.width * this.mercatorScale,
			color,
			textureIdWall: params.wall,
			textureIdWindow: hasWindows ? params.window : params.wall
		};
	}

	private static simplifyNodes(nodes: VectorNode[]): VectorNode[] {
		return <VectorNode[]>Simplify(nodes, 0.5, false);
	}
}
