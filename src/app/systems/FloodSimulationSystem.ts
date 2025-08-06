/**
 * FloodSimulationSystem - Manages FastFlood API integration and flood visualization
 *
 * Yo, this is where the magic happens for flood simulation
 * Been working on this FastFlood integration for months, finally got it smooth
 * The whole point is to make flood risk assessment actually visual and interactive
 * instead of just looking at boring 2D maps that don't tell the real story
 *
 * Real talk - getting this to work with 3D terrain was a JOURNEY
 * Had to figure out coordinate transformations, GeoTIFF processing,
 * and making sure flood planes actually hug the terrain properly
 * But now we got something that emergency planners can actually USE
 */

import System from "../System";
import FastFloodAPI, { FastFloodResponse, FloodSimulationArea, FloodSimulationParams } from "../services/FastFloodAPI";
import GeoTIFFProcessor, { FloodPolygon, FloodRasterData } from "../services/GeoTIFFProcessor";
import SceneSystem from "./SceneSystem";
import HuggingFloodPlane from "../objects/HuggingFloodPlane";
import MathUtils from "~/lib/math/MathUtils";
import ImpactAnalysisSystem, { ImpactAnalysisResults } from "./ImpactAnalysisSystem";
import Tile3DProjectedGeometryBuilder from "~/lib/tile-processing/tile3d/builders/Tile3DProjectedGeometryBuilder";
import { Tile3DRingType } from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import { ProjectedTextures } from "~/lib/tile-processing/tile3d/textures";
import TileProjectedMesh from "~/app/objects/TileProjectedMesh";
import { Tile3DBuffersProjected } from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Vec2 from "~/lib/math/Vec2";
import { RendererTypes } from "~/lib/renderer/RendererTypes";
import RenderSystem from "./RenderSystem";

export interface FloodSimulationState {
	isRunning: boolean;
	currentArea: string | null;
	returnPeriod: number;
	duration: number;
	lastResults: FastFloodResponse | null;
	floodPolygons: FloodPolygon[];
	floodRasterData: FloodRasterData | null;
	impactAnalysis: ImpactAnalysisResults | null;
	error: string | null;
}

export default class FloodSimulationSystem extends System {
	private state: FloodSimulationState = {
		isRunning: false,
		currentArea: null,
		returnPeriod: 10,
		duration: 3,
		lastResults: null,
		floodPolygons: [],
		floodRasterData: null,
		impactAnalysis: null,
		error: null
	};

	public floodPlanes: HuggingFloodPlane[] = [];
	private static instance: FloodSimulationSystem | null = null;

	public constructor() {
		super();
		FloodSimulationSystem.instance = this;
		console.log('FloodSimulationSystem: Constructor called');
	}

	public postInit(): void {
		console.log('FloodSimulationSystem: postInit called');
	}

	/**
	 * Get the singleton instance
	 */
	public static getInstance(): FloodSimulationSystem | null {
		return FloodSimulationSystem.instance;
	}

	/**
	 * Get current simulation state
	 */
	public getState(): FloodSimulationState {
		return { ...this.state };
	}

	/**
	 * Simulate flood for user-selected bounding box area with custom parameters
	 */
	public async simulateFloodForArea(
		bbox: {
			minLat: number;
			maxLat: number;
			minLon: number;
			maxLon: number;
		},
		params: Partial<FloodSimulationParams> = {}
	): Promise<void> {
		// Extract parameters for logging
		const { returnPeriod = 100, duration = 12 } = params;
		console.log(` FloodSimulationSystem: Starting flood simulation for custom area`);
		console.log(`📍 Bounding box: [${bbox.minLat}, ${bbox.minLon}] to [${bbox.maxLat}, ${bbox.maxLon}]`);
		console.log(` Parameters: ${returnPeriod}-year return period, ${duration}-hour duration`);

		// Create custom area configuration using proper coordinate conversion
		const customArea: FloodSimulationArea = FastFloodAPI.createCustomArea(
			'Custom Selected Area',
			[bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat]
		);

		// Use the same flood simulation pipeline as existing areas with custom parameters
		await this.simulateCustomArea(customArea, params);
	}

	/**
	 * Simulate flood for custom area using FastFlood API with actual coordinates and custom parameters
	 */
	private async simulateCustomArea(
		area: FloodSimulationArea,
		params: Partial<FloodSimulationParams> = {}
	): Promise<void> {
		// Extract parameters for logging
		const { returnPeriod = 100, duration = 12 } = params;
		console.log(` Simulating flood for custom area: ${area.name}`);
		console.log(`📍 Using actual coordinates: [${area.bbox[1]}, ${area.bbox[0]}] to [${area.bbox[3]}, ${area.bbox[2]}]`);
		console.log(` Custom parameters: ${returnPeriod}-year return period, ${duration}-hour duration`);

		if (this.state.isRunning) {
			throw new Error('Simulation already running');
		}

		this.state.isRunning = true;
		this.state.currentArea = area.name;
		this.state.returnPeriod = returnPeriod;
		this.state.duration = duration;
		this.state.error = null;

		try {
			// Clear any existing flood visualization first
			this.clearFloodVisualization();

			// Call FastFlood API with actual custom coordinates and parameters
			console.log(` GeoTwin: Sending request to FastFlood API for custom area...`);
			const results = await this.runCustomAreaFloodSimulation(area, params);
			this.state.lastResults = results;

			// Get water height GeoTIFF URL
			const waterHeightURL = FastFloodAPI.getWaterHeightURL(results);
			if (!waterHeightURL) {
				throw new Error('No water height data in simulation results');
			}

			// Download and process GeoTIFF for custom area
			console.log(` GeoTwin: Downloading flood data GeoTIFF for custom area...`);
			const geoTiffData = await FastFloodAPI.downloadGeoTIFF(waterHeightURL);

			// Process flood data using custom area coordinates (GPU-BASED APPROACH)
			console.log(` GeoTwin: Processing real FastFlood GeoTIFF data for GPU rendering...`);
			const floodRasterData = await GeoTIFFProcessor.processWaterHeightGeoTIFFToRaster(
				geoTiffData,
				area.projectedBbox
			);

			// Create GPU-based flood visualization for custom area
			await this.createGPUFloodVisualization(floodRasterData, area);

			// LEGACY APPROACH (commented out for performance)
			// const floodPolygons = await GeoTIFFProcessor.processWaterHeightGeoTIFF(
			//     geoTiffData,
			//     area.projectedBbox
			// );
			// await this.createFloodVisualization(floodPolygons, area);

			// Store flood polygons in state for impact analysis AFTER visualization
			// this.state.floodPolygons = floodPolygons;

			console.log(` GeoTwin: Custom area flood simulation completed successfully`);
			// console.log(` Generated ${floodPolygons.length} flood polygons for custom area`);
			console.log(` Flood visualization ready! Check selected area for flood planes`);
			console.log(`📍 Navigate to selected coordinates to see the flood visualization`);

			// Trigger impact analysis after successful flood simulation
			try {
				await this.performImpactAnalysis();
				console.log(' ✅ GeoTwin: Impact analysis completed');
			} catch (impactError) {
				console.error(' GeoTwin: Impact analysis failed:', impactError);
			}


		} catch (error) {
			console.error(` Failed to simulate flood for custom area:`, error);
			this.state.error = error.message;
			throw error;
		} finally {
			this.state.isRunning = false;
		}
	}

	/**
	 * Run flood simulation for custom area using FastFlood API
	 */
	private async runCustomAreaFloodSimulation(
		area: FloodSimulationArea,
		params: Partial<FloodSimulationParams> = {}
	): Promise<FastFloodResponse> {
		// Extract parameters for logging
		const { returnPeriod = 100, duration = 12 } = params;
		console.log(` GeoTwin: Calling FastFlood API for custom area: ${area.name}`);
		console.log(`📍 Custom area coordinates: [${area.bbox[1]}, ${area.bbox[0]}] to [${area.bbox[3]}, ${area.bbox[2]}]`);
		console.log(`📍 Projected coordinates: [${area.projectedBbox[0]}, ${area.projectedBbox[1]}] to [${area.projectedBbox[2]}, ${area.projectedBbox[3]}]`);

		// Temporarily add custom area to SIMULATION_AREAS for API call
		const tempAreaId = 'custom-area-temp';
		(FastFloodAPI.SIMULATION_AREAS as any)[tempAreaId] = area;

		try {
			// Use the existing FastFlood API method
			const result = await FastFloodAPI.runFloodSimulation(tempAreaId, params);

			console.log(` GeoTwin: Flood simulation completed for custom area`);
			console.log(` Generated files:`, result.data.files.map(f => f.name));

			return result;
		} catch (error) {
			console.error(` GeoTwin: Flood simulation failed for custom area:`, error);
			throw error;
		} finally {
			// Clean up temporary area
			delete (FastFloodAPI.SIMULATION_AREAS as any)[tempAreaId];
		}
	}

	/**
	 * Run flood simulation for a specific area with full parameters
	 */
	public async runSimulation(
		areaId: string,
		params: Partial<FloodSimulationParams> = {}
	): Promise<void> {
		// Extract parameters for logging
		const { returnPeriod = 100, duration = 12 } = params;
		if (this.state.isRunning) {
			throw new Error('Simulation already running');
		}

		console.log(`GeoTwin: Starting flood simulation for ${areaId}`);

		this.state.isRunning = true;
		this.state.currentArea = areaId;
		this.state.returnPeriod = returnPeriod;
		this.state.duration = duration;
		this.state.error = null;

		try {
			// Run FastFlood simulation
			console.log(` GeoTwin: Sending request to FastFlood API for ${areaId}...`);
			const results = await FastFloodAPI.runFloodSimulation(areaId, params);
			this.state.lastResults = results;

			// Get water height GeoTIFF URL
			console.log(` GeoTwin: API response files:`, results.data.files.map(f => f.name));
			const waterHeightURL = FastFloodAPI.getWaterHeightURL(results);
			console.log(` GeoTwin: Water height URL:`, waterHeightURL);
			if (!waterHeightURL) {
				throw new Error('No water height data in simulation results');
			}

			// Download and process GeoTIFF
			const area = FastFloodAPI.SIMULATION_AREAS[areaId];
			if (!area) {
				throw new Error(`Unknown area: ${areaId}`);
			}

			console.log(` GeoTwin: Downloading flood data GeoTIFF...`);
			const geoTiffData = await FastFloodAPI.downloadGeoTIFF(waterHeightURL);

			// Process flood data (GPU-BASED APPROACH)
			console.log(` GeoTwin: Processing real FastFlood GeoTIFF data for GPU rendering...`);
			const floodRasterData = await GeoTIFFProcessor.processWaterHeightGeoTIFFToRaster(
				geoTiffData,
				area.projectedBbox
			);

			console.log(` GeoTwin: Processed raster data ${floodRasterData.width}x${floodRasterData.height}`);

			// Store flood raster data in state for impact analysis
			this.state.floodRasterData = floodRasterData;

			// Create GPU-based flood visualization
			console.log(` GeoTwin: Creating GPU-based flood visualization...`);
			await this.createGPUFloodVisualization(floodRasterData, area);

			// LEGACY APPROACH (commented out for performance)
			// const floodPolygons = await GeoTIFFProcessor.processWaterHeightGeoTIFF(
			//     geoTiffData,
			//     area.projectedBbox
			// );
			// console.log(` GeoTwin: Processed ${floodPolygons.length} flood polygons`);
			// this.state.floodPolygons = floodPolygons;
			// await this.createFloodVisualization(floodPolygons, area);

			console.log(` GeoTwin: Flood simulation completed for ${areaId}`);
			// console.log(` Generated ${floodPolygons.length} flood polygons`);
			console.log(` Flood visualization ready! Check Grand Bay area for flood planes`);
			console.log(`📍 Navigate to Grand Bay, Dominica (15.25°N, 61.30°W) to see the flood visualization`);

			// Trigger impact analysis after successful flood simulation
			try {
				await this.performImpactAnalysis();
				console.log(' ✅ GeoTwin: Impact analysis completed');
			} catch (impactError) {
				console.error(' GeoTwin: Impact analysis failed:', impactError);
			}

		} catch (error) {
			console.error(` GeoTwin: Flood simulation failed:`, error);
			this.state.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			this.state.isRunning = false;
		}
	}

	/**
	 * Create GPU-based flood visualization from raster data (HIGH PERFORMANCE)
	 */
	private async createGPUFloodVisualization(
		floodRasterData: FloodRasterData,
		area: FloodSimulationArea
	): Promise<void> {
		console.log(' GeoTwin: Reverting to proven HuggingFloodPlane approach...');

		// Instead of using raster data, re-download and process using the WORKING method
		const fastFloodResponse = this.state.lastResults;
		if (!fastFloodResponse) {
			console.error(' No FastFlood results available for proven approach');
			return;
		}

		const waterHeightURL = FastFloodAPI.getWaterHeightURL(fastFloodResponse);
		if (!waterHeightURL) {
			console.error(' No water height URL available for proven approach');
			return;
		}

		console.log(' GeoTwin: Re-downloading GeoTIFF for proven processing...');
		const geoTiffData = await FastFloodAPI.downloadGeoTIFF(waterHeightURL);

		// Use the PROVEN method that works
		console.log(' GeoTwin: Processing with proven GeoTIFFProcessor.processWaterHeightGeoTIFF...');
		const floodPolygons = await GeoTIFFProcessor.processWaterHeightGeoTIFF(
			geoTiffData,
			area.projectedBbox
		);

		console.log(` Created ${floodPolygons.length} flood polygons using proven method`);

		// Store in state for impact analysis
		this.state.floodPolygons = floodPolygons;

		// Use proven data processing but create GPU flood plane instead
		await this.createGPUFloodFromPolygons(floodPolygons, area);

		console.log(` ✅ GPU flood visualization created using proven data processing!`);
	}

	/**
	 * Create GPU flood plane from proven polygon data
	 * Uses exact same data processing as working approach but renders as single GPU plane
	 */
	private async createGPUFloodFromPolygons(
		floodPolygons: FloodPolygon[],
		area: FloodSimulationArea
	): Promise<void> {
		console.log(` Creating GPU flood plane from ${floodPolygons.length} proven flood polygons`);

		this.clearFloodVisualization();

		const sceneSystem = this.systemManager.getSystem(SceneSystem);
		if (!sceneSystem) {
			console.error(' SceneSystem not available');
			return;
		}

		if (floodPolygons.length === 0) {
			console.warn(' No flood polygons to visualize');
			return;
		}

		// Calculate overall bounding box from all flood polygons
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

		for (const polygon of floodPolygons) {
			minX = Math.min(minX, polygon.boundingBox.minX);
			minY = Math.min(minY, polygon.boundingBox.minY);
			maxX = Math.max(maxX, polygon.boundingBox.maxX);
			maxY = Math.max(maxY, polygon.boundingBox.maxY);
		}

		// Create single large HuggingFloodPlane using PROVEN approach
		// Position at CENTER like working individual planes
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const geoTwinCoords = this.convertToGeoTwinCoordinates(centerX, centerY, area);

		// Create large HuggingFloodPlane with special textureId for flood rendering
		const largeFloodPlane = new HuggingFloodPlane([0, 0.5, 1]); // Blue color for flood

		// Set special textureId = 100 for flood water (different from normal water textureId = 0)
		(largeFloodPlane as any).textureId = 100;

		// Position at center using EXACT same approach as working individual planes
		const terrainOffset = 0.5; // 50cm above terrain - same as working individual planes
		largeFloodPlane.position.set(geoTwinCoords.x, terrainOffset, geoTwinCoords.z);
		largeFloodPlane.updateMatrix();

		// Store flood data for large area coverage
		const planeWidth = maxX - minX;
		const planeHeight = maxY - minY;
		const avgWaterHeight = floodPolygons.reduce((sum, p) => {
			const avgHeight = p.waterHeights.length > 0
				? p.waterHeights.reduce((s, h) => s + h, 0) / p.waterHeights.length
				: 0;
			return sum + avgHeight;
		}, 0) / floodPolygons.length;

		// Set large grid cell size to cover entire flood area
		(largeFloodPlane as any).floodDepth = avgWaterHeight;
		(largeFloodPlane as any).gridCellSize = {
			width: planeWidth,
			height: planeHeight
		};

		// Store flood area bounds for proper UV mapping
		(largeFloodPlane as any).floodAreaBounds = {
			minX, minY, maxX, maxY,
			width: planeWidth,
			height: planeHeight
		};

		// Create flood texture for transparency
		const textureSize = 256;
		const floodData = new Float32Array(textureSize * textureSize);

		// Fill texture with flood depths from polygons (ROTATED 90 degrees anti-clockwise)
		for (let y = 0; y < textureSize; y++) {
			for (let x = 0; x < textureSize; x++) {
				// ROTATION FIX: Swap and flip coordinates for 90-degree anti-clockwise rotation
				const worldX = minX + (y / textureSize) * planeWidth;  // Use Y for X
				const worldY = minY + ((textureSize - 1 - x) / textureSize) * planeHeight;  // Use flipped X for Y

				// Find polygon containing this point
				const polygon = floodPolygons.find(p =>
					worldX >= p.boundingBox.minX && worldX <= p.boundingBox.maxX &&
					worldY >= p.boundingBox.minY && worldY <= p.boundingBox.maxY
				);

				// Use average water height from polygon's waterHeights array
				const waterHeight = polygon && polygon.waterHeights.length > 0
					? polygon.waterHeights.reduce((sum, h) => sum + h, 0) / polygon.waterHeights.length
					: 0.0;

				floodData[y * textureSize + x] = waterHeight;
			}
		}

		// Create flood texture
		const renderSystem = this.systemManager.getSystem(RenderSystem);
		const renderer = (renderSystem as any).renderer;

		const floodTexture = renderer.createTexture2D({
			width: textureSize,
			height: textureSize,
			data: floodData,
			format: RendererTypes.TextureFormat.R32Float,
			minFilter: RendererTypes.MinFilter.Linear,
			magFilter: RendererTypes.MagFilter.Linear,
			wrapS: RendererTypes.TextureWrap.ClampToEdge,
			wrapT: RendererTypes.TextureWrap.ClampToEdge,
			mipmaps: false
		});

		// Attach flood texture to the large flood plane
		(largeFloodPlane as any).floodTexture = floodTexture;

		// Add to scene using EXACT same approach
		const wrapper = sceneSystem.objects.wrapper;
		wrapper.add(largeFloodPlane);
		(sceneSystem as any).objects['globalFloodPlane'] = largeFloodPlane;

		console.log(` ✅ Large HuggingFloodPlane created with transparency texture!`);
		console.log(` Plane dimensions: ${planeWidth.toFixed(1)}x${planeHeight.toFixed(1)} covering ${floodPolygons.length} flood areas`);
	}



	/**
	 * Create flood visualization from processed data (LEGACY METHOD - kept for compatibility)
	 */
	private async createFloodVisualization(
		floodPolygons: FloodPolygon[],
		area: FloodSimulationArea
	): Promise<void> {
		console.log(' GeoTwin: Creating dynamic flood visualization...');

		// Clear existing flood planes
		this.clearFloodVisualization();

		const sceneSystem = this.systemManager.getSystem(SceneSystem);
		if (!sceneSystem) {
			console.error(' SceneSystem not available');
			return;
		}

		if (floodPolygons.length === 0) {
			console.warn(' No flood polygons to visualize');
			return;
		}

		console.log(` Creating complete flood coverage for ${floodPolygons.length} flooded grid cells`);

		// Create dynamic flood planes for each polygon
		const wrapper = (sceneSystem as any).objects.wrapper;
		if (!wrapper) {
			console.error(' Scene wrapper not available');
			return;
		}

		// Create flood plane for EVERY flooded grid cell - no limits for complete coverage
		const planesToCreate = floodPolygons.length;

		console.log(` Creating flood plane for EVERY flooded grid cell (${floodPolygons.length} planes)`);
		console.log(` Coverage Analysis: Processing ${planesToCreate} flooded cells for 100% accuracy`);

		// Create dynamic flood planes for complete coverage with edge curvature
		let successfullyCreated = 0;
		let registrationFailures = 0;

		// CONNECTIVITY FIX: Skip edge curvature processing for better connectivity
		// Edge curvature can cause gaps between flood planes
		const processedPolygons = floodPolygons; // Use original polygons for seamless connection

		for (let i = 0; i < planesToCreate; i++) {
			const polygon = processedPolygons[i];

			try {
				// Position plane at the center of the flood polygon
				const centerX = (polygon.boundingBox.minX + polygon.boundingBox.maxX) / 2;
				const centerY = (polygon.boundingBox.minY + polygon.boundingBox.maxY) / 2;

				// Convert from GeoTIFF coordinates to GeoTwin coordinates
				const geoTwinCoords = this.convertToGeoTwinCoordinates(centerX, centerY, area);

				// Create simple flood plane - focus on basic functionality only
				const avgWaterHeight = polygon.waterHeights[0]; // All vertices have same height for grid cells

				// Create basic flood plane with default blue color
				const floodPlane = new HuggingFloodPlane([0.2, 0.5, 0.8]); // Simple blue water color

				// CONNECTIVITY FIX: Set grid cell dimensions with overlap buffer
				const cellWidth = polygon.cellWidth || 20; // Default fallback
				const cellHeight = polygon.cellHeight || 20; // Default fallback

				// Calculate overlap buffer for seamless connection
				const connectivityBuffer = Math.max(cellWidth, cellHeight) * 0.15; // 15% buffer

				// Set gridCellSize with buffer included - this affects the actual geometry size
				(floodPlane as any).gridCellSize = {
					width: cellWidth + connectivityBuffer,
					height: cellHeight + connectivityBuffer
				};

				// Store original cell dimensions for reference
				(floodPlane as any).originalCellSize = {
					width: cellWidth,
					height: cellHeight
				};

				// Set flood depth for height representation
				(floodPlane as any).floodDepth = Math.max(avgWaterHeight, 0.1);

				// SIMPLE FIX: Use large enough Y-offset to prevent depth fighting at any angle
				const terrainOffset = 0.5; // 50cm above terrain - large enough to prevent depth fighting
				floodPlane.position.set(geoTwinCoords.x, terrainOffset, geoTwinCoords.z);
				floodPlane.updateMatrix();
				wrapper.add(floodPlane);

				// Register with SceneSystem objects using dynamic names
				const floodPlaneName = `fastFloodPlane${i + 1}`;
				(sceneSystem as any).objects[floodPlaneName] = floodPlane;

				this.floodPlanes.push(floodPlane);
				successfullyCreated++;

			} catch (error) {
				console.error(` Failed to create flood plane ${i + 1}:`, error);
				registrationFailures++;
			}
		}

		console.log(` Flood Plane Creation Summary:`);
		console.log(`    Successfully created: ${successfullyCreated} flood planes`);
		console.log(`    Failed: ${registrationFailures} flood planes`);
		console.log(`    Coverage: ${((successfullyCreated / planesToCreate) * 100).toFixed(1)}%`);

		console.log(` GeoTwin: Dynamic flood visualization created from real FastFlood data`);
	}

	/**
	 * Convert GeoTIFF coordinates to GeoTwin coordinate system
	 */
	private convertToGeoTwinCoordinates(
		geoTiffX: number,
		geoTiffY: number,
		area: FloodSimulationArea
	): { x: number; z: number } {
		// Convert from projected coordinates to WGS84
		const [projMinX, projMinY, projMaxX, projMaxY] = area.projectedBbox;
		const [wgs84MinX, wgs84MinY, wgs84MaxX, wgs84MaxY] = area.bbox;

		// Normalize position within the projected bbox
		const normalizedX = (geoTiffX - projMinX) / (projMaxX - projMinX);
		const normalizedY = (geoTiffY - projMinY) / (projMaxY - projMinY);

		// Convert to WGS84
		const wgs84Lon = wgs84MinX + normalizedX * (wgs84MaxX - wgs84MinX);
		const wgs84Lat = wgs84MinY + normalizedY * (wgs84MaxY - wgs84MinY);

		// Convert to GeoTwin coordinates
		const geoTwinCoords = MathUtils.degrees2meters(wgs84Lat, wgs84Lon);

		return { x: geoTwinCoords.x, z: geoTwinCoords.y };
	}



	/**
	 * Calculate smoothed depth by blending with neighboring flood planes
	 * Creates natural-looking water surface gradients
	 */
	private calculateSmoothedDepth(
		currentPolygon: any,
		allPolygons: any[],
		currentIndex: number
	): number {
		const currentDepth = currentPolygon.waterHeights[0];
		const smoothingRadius = 50; // 50 meters smoothing radius
		const maxNeighbors = 8; // Consider up to 8 nearest neighbors

		// Get current polygon center
		const currentCenterX = (currentPolygon.boundingBox.minX + currentPolygon.boundingBox.maxX) / 2;
		const currentCenterY = (currentPolygon.boundingBox.minY + currentPolygon.boundingBox.maxY) / 2;

		// Find nearby polygons for smoothing
		const neighbors: { distance: number; depth: number }[] = [];

		for (let i = 0; i < allPolygons.length; i++) {
			if (i === currentIndex) continue; // Skip self

			const neighbor = allPolygons[i];
			const neighborCenterX = (neighbor.boundingBox.minX + neighbor.boundingBox.maxX) / 2;
			const neighborCenterY = (neighbor.boundingBox.minY + neighbor.boundingBox.maxY) / 2;

			// Calculate distance between centers
			const dx = neighborCenterX - currentCenterX;
			const dy = neighborCenterY - currentCenterY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Only consider neighbors within smoothing radius
			if (distance <= smoothingRadius) {
				neighbors.push({
					distance,
					depth: neighbor.waterHeights[0]
				});
			}
		}

		// If no neighbors, return original depth
		if (neighbors.length === 0) {
			return currentDepth;
		}

		// Sort by distance and take closest neighbors
		neighbors.sort((a, b) => a.distance - b.distance);
		const closeNeighbors = neighbors.slice(0, maxNeighbors);

		// Calculate weighted average based on inverse distance
		let weightedSum = currentDepth; // Start with current depth
		let totalWeight = 1.0; // Current depth has weight of 1

		for (const neighbor of closeNeighbors) {
			// Inverse distance weighting (closer neighbors have more influence)
			const weight = 1.0 / (1.0 + neighbor.distance / smoothingRadius);
			weightedSum += neighbor.depth * weight;
			totalWeight += weight;
		}

		// Return smoothed depth
		const smoothedDepth = weightedSum / totalWeight;

		// Ensure smoothed depth doesn't deviate too much from original
		// But allow more variation for edge cells to create natural boundaries
		const maxDeviation = currentDepth * 0.4; // Allow 40% deviation for natural edges
		const finalDepth = Math.max(
			currentDepth - maxDeviation,
			Math.min(currentDepth + maxDeviation, smoothedDepth)
		);

		// Apply minimum depth clamping to ensure visibility
		return Math.max(finalDepth, 0.08); // Minimum 8cm for visibility
	}

	/**
	 * Apply edge curvature to flood polygons for natural boundaries
	 * Detects edge polygons and curves them toward neighboring flood areas
	 */
	private applyEdgeCurvature(floodPolygons: any[]): any[] {
		const gridSize = 20; // Approximate grid cell size in meters
		const curvatureStrength = 0.3; // How much to curve edges (30% of cell size)

		// Create spatial index for fast neighbor lookup
		const spatialIndex = new Map<string, number>();
		floodPolygons.forEach((polygon, index) => {
			const centerX = (polygon.boundingBox.minX + polygon.boundingBox.maxX) / 2;
			const centerY = (polygon.boundingBox.minY + polygon.boundingBox.maxY) / 2;
			const gridX = Math.floor(centerX / gridSize);
			const gridY = Math.floor(centerY / gridSize);
			const key = `${gridX},${gridY}`;
			spatialIndex.set(key, index);
		});

		// Process each polygon for edge detection and curvature
		return floodPolygons.map((polygon, index) => {
			const centerX = (polygon.boundingBox.minX + polygon.boundingBox.maxX) / 2;
			const centerY = (polygon.boundingBox.minY + polygon.boundingBox.maxY) / 2;
			const gridX = Math.floor(centerX / gridSize);
			const gridY = Math.floor(centerY / gridSize);

			// Check 8 neighboring grid cells
			const neighbors = [
				[-1, -1], [-1, 0], [-1, 1],
				[ 0, -1],          [ 0, 1],
				[ 1, -1], [ 1, 0], [ 1, 1]
			];

			const neighborPositions: { x: number; y: number }[] = [];
			let missingNeighbors = 0;

			for (const [dx, dy] of neighbors) {
				const neighborKey = `${gridX + dx},${gridY + dy}`;
				if (spatialIndex.has(neighborKey)) {
					const neighborIndex = spatialIndex.get(neighborKey);
					if (neighborIndex !== undefined) {
						const neighborPolygon = floodPolygons[neighborIndex];
						const neighborCenterX = (neighborPolygon.boundingBox.minX + neighborPolygon.boundingBox.maxX) / 2;
						const neighborCenterY = (neighborPolygon.boundingBox.minY + neighborPolygon.boundingBox.maxY) / 2;
						neighborPositions.push({ x: neighborCenterX, y: neighborCenterY });
					}
				} else {
					missingNeighbors++;
				}
			}

			// If this is an edge polygon (missing neighbors), apply curvature
			if (missingNeighbors > 0 && neighborPositions.length > 0) {
				// Calculate center of mass of neighboring flood areas
				const neighborCenter = neighborPositions.reduce(
					(acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
					{ x: 0, y: 0 }
				);
				neighborCenter.x /= neighborPositions.length;
				neighborCenter.y /= neighborPositions.length;

				// Apply subtle curvature toward neighbor center
				return this.applyCurvatureToPolygon(polygon, centerX, centerY, neighborCenter.x, neighborCenter.y, curvatureStrength);
			}

			return polygon; // No curvature needed for interior polygons
		});
	}

	/**
	 * Create flood plane using EXACT same methodology as roads
	 * This follows the proven TileProjectedMesh approach that roads use
	 */
	private createRoadLikeFloodPlane(
		centerX: number,
		centerZ: number,
		width: number,
		height: number,
		floodDepth: number,
		depthColor?: [number, number, number]
	): TileProjectedMesh {
		// Create rectangle vertices like roads do
		const halfWidth = width / 2;
		const halfHeight = height / 2;
		const vertices = [
			new Vec2(-halfWidth, -halfHeight),
			new Vec2(halfWidth, -halfHeight),
			new Vec2(halfWidth, halfHeight),
			new Vec2(-halfWidth, halfHeight),
			new Vec2(-halfWidth, -halfHeight) // Close the ring
		];

		// Use EXACT same builder as roads
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.addRing(Tile3DRingType.Outer, vertices);

		// Add surface using EXACT same method as roads with height parameter
		builder.addPath({
			width: Math.max(width, height), // Use larger dimension for coverage
			uvFollowRoad: false,
			uvScale: 10,
			textureId: 100, // Use special flood textureId = 100 for flood water rendering
			height: floodDepth // This is the critical parameter that roads use!
		});

		// Get the geometry using EXACT same process as roads
		const geometry = builder.getGeometry();

		// Convert AABB3D boundingBox to flat BoundingBox format (like roads do)
		const buffers: Tile3DBuffersProjected = {
			positionBuffer: geometry.positionBuffer,
			normalBuffer: geometry.normalBuffer,
			uvBuffer: geometry.uvBuffer,
			textureIdBuffer: geometry.textureIdBuffer,
			boundingBox: {
				minX: geometry.boundingBox.min.x,
				minY: geometry.boundingBox.min.y,
				minZ: geometry.boundingBox.min.z,
				maxX: geometry.boundingBox.max.x,
				maxY: geometry.boundingBox.max.y,
				maxZ: geometry.boundingBox.max.z
			}
		};

		// Create TileProjectedMesh using EXACT same class as roads
		const floodPlane = new TileProjectedMesh(buffers);
		// Add small Z-offset (1cm) to eliminate depth-fighting with terrain
		floodPlane.position.set(centerX, 0.01, centerZ);
		floodPlane.updateMatrix();

		return floodPlane;
	}



	/**
	 * Apply curvature to a polygon's vertices to create natural edges
	 */
	private applyCurvatureToPolygon(
		polygon: any,
		centerX: number,
		centerY: number,
		neighborCenterX: number,
		neighborCenterY: number,
		curvatureStrength: number
	): any {
		// Calculate direction vector toward neighbor center
		const dirX = neighborCenterX - centerX;
		const dirY = neighborCenterY - centerY;
		const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

		if (dirLength === 0) return polygon; // No direction to curve toward

		// Normalize direction
		const normDirX = dirX / dirLength;
		const normDirY = dirY / dirLength;

		// Apply curvature to vertices (subtle modification)
		const curvedVertices = new Float32Array(polygon.vertices.length);
		for (let i = 0; i < polygon.vertices.length; i += 3) {
			const x = polygon.vertices[i];
			const y = polygon.vertices[i + 1]; // Y is height, don't modify
			const z = polygon.vertices[i + 2];

			// Calculate distance from polygon center
			const distFromCenterX = x - centerX;
			const distFromCenterZ = z - centerY;
			const distFromCenter = Math.sqrt(distFromCenterX * distFromCenterX + distFromCenterZ * distFromCenterZ);

			// Apply curvature based on distance from center (stronger at edges)
			const curvatureFactor = Math.min(distFromCenter / 10, 1) * curvatureStrength;
			const curveOffsetX = normDirX * curvatureFactor;
			const curveOffsetZ = normDirY * curvatureFactor;

			curvedVertices[i] = x + curveOffsetX;
			curvedVertices[i + 1] = y; // Keep height unchanged
			curvedVertices[i + 2] = z + curveOffsetZ;
		}

		// Return modified polygon
		return {
			...polygon,
			vertices: curvedVertices
		};
	}



	/**
	 * Clear existing flood visualization
	 */
	public clearFloodVisualization(): void {
		console.log(' GeoTwin: Clearing flood visualization...');

		const sceneSystem = this.systemManager.getSystem(SceneSystem);
		if (!sceneSystem) return;

		const wrapper = (sceneSystem as any).objects.wrapper;
		if (!wrapper) return;

		// Remove all dynamic flood planes and unregister them
		for (let i = 0; i < this.floodPlanes.length; i++) {
			const floodPlane = this.floodPlanes[i];
			const floodPlaneName = `fastFloodPlane${i + 1}`;

			// Remove from wrapper
			wrapper.remove(floodPlane);

			// Unregister from SceneSystem objects (CRITICAL - this is what makes them stop rendering)
			delete (sceneSystem as any).objects[floodPlaneName];

			// Dispose resources
			floodPlane.dispose();
		}

		// Also clean up any remaining fastFloodPlane objects that might exist
		const sceneObjects = (sceneSystem as any).objects;
		const objectsToDelete: string[] = [];

		for (const objectName in sceneObjects) {
			if (objectName.startsWith('fastFloodPlane')) {
				objectsToDelete.push(objectName);
			}
		}

		for (const objectName of objectsToDelete) {
			const floodPlane = sceneObjects[objectName];
			if (floodPlane) {
				wrapper.remove(floodPlane);
				floodPlane.dispose();
				delete sceneObjects[objectName];
			}
		}

		// Clear GPU-based global flood plane
		const globalFloodPlane = sceneObjects.globalFloodPlane;
		if (globalFloodPlane) {
			wrapper.remove(globalFloodPlane);
			globalFloodPlane.dispose();
			delete sceneObjects.globalFloodPlane;
			console.log(' GeoTwin: GPU global flood plane cleared');
		}

		// Clear TileProjectedMesh-based global flood plane
		const globalFloodProjectedMesh = sceneObjects.globalFloodProjectedMesh;
		if (globalFloodProjectedMesh) {
			wrapper.remove(globalFloodProjectedMesh);
			globalFloodProjectedMesh.dispose();
			delete sceneObjects.globalFloodProjectedMesh;
			console.log(' GeoTwin: GPU global flood projected mesh cleared');
		}

		this.floodPlanes = [];
		this.state.floodPolygons = [];
		console.log(` GeoTwin: Flood visualization cleared (removed ${objectsToDelete.length} flood planes)`);

		// Also clear impact analysis when clearing visualization
		this.clearImpactAnalysis();
	}

	/**
	 * Get available simulation areas
	 */
	public getAvailableAreas(): Record<string, FloodSimulationArea> {
		return FastFloodAPI.SIMULATION_AREAS;
	}

	/**
	 * Update simulation parameters
	 */
	public updateParameters(returnPeriod: number, duration: number): void {
		this.state.returnPeriod = returnPeriod;
		this.state.duration = duration;
		console.log(` GeoTwin: Updated simulation parameters: ${returnPeriod}-year, ${duration}-hour`);
	}

	/**
	 * Convert projected Y coordinate to WGS84 latitude (approximate)
	 */
	private projectedToWGS84Lat(projectedY: number): number {
		// Simplified conversion for Dominica area
		return 15.25 + (projectedY - 1718000) / 100000;
	}

	/**
	 * Convert projected X coordinate to WGS84 longitude (approximate)
	 */
	private projectedToWGS84Lon(projectedX: number): number {
		// Simplified conversion for Dominica area
		return -61.3 + (projectedX + 6825000) / -100000;
	}

	/**
	 * Refresh flood visualization from current simulation data
	 */
	public async refreshVisualization(): Promise<void> {
		if (!this.state.lastResults) {
			throw new Error('No simulation data available to refresh');
		}

		console.log(' GeoTwin: Refreshing flood visualization...');

		try {
			// Clear existing flood planes
			this.clearFloodVisualization();

			// Recreate flood visualization from existing results
			const geoTiffUrl = FastFloodAPI.getWaterHeightURL(this.state.lastResults);
			if (geoTiffUrl) {
				// TODO: Implement GPU-based flood visualization refresh
				console.log(' GeoTwin: Flood visualization refresh not yet implemented for GPU approach');
			}
		} catch (error) {
			console.error(' GeoTwin: Failed to refresh flood visualization:', error);
			throw error;
		}
	}

	/**
	 * Perform impact analysis on current flood simulation results
	 */
	public async performImpactAnalysis(): Promise<ImpactAnalysisResults | null> {
		try {
			const impactSystem = this.getOrCreateImpactAnalysisSystem();
			const results = await impactSystem.analyzeFloodImpact();
			this.state.impactAnalysis = results;
			return results;
		} catch (error) {
			console.error(' GeoTwin: Impact analysis failed:', error);
			this.state.impactAnalysis = null;
			return null;
		}
	}

	/**
	 * Get or create impact analysis system
	 */
	private getOrCreateImpactAnalysisSystem(): ImpactAnalysisSystem {
		// For now, create a new instance each time since it's not registered with SystemManager
		// In a full implementation, this would be properly registered
		const impactSystem = new ImpactAnalysisSystem();
		impactSystem.systemManager = this.systemManager;
		return impactSystem;
	}

	/**
	 * Get current impact analysis results
	 */
	public getImpactAnalysis(): ImpactAnalysisResults | null {
		return this.state.impactAnalysis;
	}

	/**
	 * Clear impact analysis results
	 */
	public clearImpactAnalysis(): void {
		this.state.impactAnalysis = null;
		// Impact analysis is created on-demand, so just clear the state
		console.log(' GeoTwin: Impact analysis results cleared');
	}

	/**
	 * Test simulation with Grand Bay
	 */
	public async testGrandBaySimulation(): Promise<void> {
		console.log(' GeoTwin: Testing Grand Bay flood simulation...');
		await this.runSimulation('grand-bay', { returnPeriod: 100, duration: 12 });
	}

	public update(_deltaTime: number): void {
		// No continuous updates needed for flood simulation
		// The visualization is handled by the rendering system
	}
}

// Global function for testing
(globalThis as any).testFloodSimulation = async (): Promise<void> => {
	const floodSystem = FloodSimulationSystem.getInstance();
	if (floodSystem) {
		await floodSystem.testGrandBaySimulation();
	} else {
		console.error(' FloodSimulationSystem not available');
	}
};
