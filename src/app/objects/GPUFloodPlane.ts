import RenderableObject3D from './RenderableObject3D';
import AbstractMesh from '~/lib/renderer/abstract-renderer/AbstractMesh';
import AbstractMaterial from '~/lib/renderer/abstract-renderer/AbstractMaterial';
import AbstractRenderer from '~/lib/renderer/abstract-renderer/AbstractRenderer';
import {RendererTypes} from '~/lib/renderer/RendererTypes';
import AbstractTexture2D from '~/lib/renderer/abstract-renderer/AbstractTexture2D';
import {FloodRasterData} from '../services/GeoTIFFProcessor';
import Vec3 from '~/lib/math/Vec3';

export default class GPUFloodPlane extends RenderableObject3D {
	// These properties are required by the abstract base class `RenderableObject3D`
	public override mesh: AbstractMesh = null;
	public material: AbstractMaterial = null;

	// Custom properties for this class
	public floodRasterData: FloodRasterData = null;
	public floodTexture: AbstractTexture2D = null;
	private geometryData: {
		positions: Float32Array;
		uvs: Float32Array;
		indices: Uint32Array;
	};

	public constructor(
		geometry: {
			positions: Float32Array;
			uvs: Float32Array;
			indices: Uint32Array;
		},
		material: AbstractMaterial,
		// Accept the real bounding box from the simulation
		boundingBox: [number, number, number, number]
	) {
		super();
		this.geometryData = geometry;
		this.material = material;

		// Use the precise bounding box from the GeoTIFF data.
		// We add a vertical buffer for the potential water height.
		const [minX, minY, maxX, maxY] = boundingBox;
		this.setBoundingBox(
			new Vec3(minX, minY, -10), // Use real X and Y, with a buffer for Z (height)
			new Vec3(maxX, maxY, 100)  // Max water height buffer
		);
	}

	// This method is required by the abstract base class
	public override isMeshReady(): boolean {
		return this.mesh !== null;
	}

	// This method is required by the abstract base class
	public override updateMesh(renderer: AbstractRenderer): void {
		if (this.mesh) {
			return;
		}

		this.mesh = renderer.createMesh({
			attributes: [
				renderer.createAttribute({
					name: 'position',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: this.geometryData.positions
					})
				}),
				renderer.createAttribute({
					name: 'uv',
					size: 2,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: this.geometryData.uvs
					})
				})
			],
			indices: this.geometryData.indices
		});
	}

	// This is a new method, so it does NOT get the 'override' keyword.
	public dispose(): void {
		if (this.mesh) {
			this.mesh.getAttribute('position').buffer.delete();
			this.mesh.getAttribute('uv').buffer.delete();
			this.mesh.delete();
			this.mesh = null;
		}
		if (this.floodTexture) {
			this.floodTexture.delete();
			this.floodTexture = null;
		}
	}
}
