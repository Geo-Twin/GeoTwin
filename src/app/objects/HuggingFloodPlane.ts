// This is my baby right here - the HuggingFloodPlane
// Took me FOREVER to figure out how to make flood water actually follow terrain
// The trick was studying how farms and beaches work in the original codebase
// They use this "hugging" mesh system that samples terrain height
// Had to adapt that for flood visualization and it was NOT easy
// But now we got flood water that actually looks realistic on 3D terrain

import RenderableObject3D from "./RenderableObject3D";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import Vec3 from "~/lib/math/Vec3";

/**
 * HuggingFloodPlane - Creates flood geometry that hugs terrain like farms/beaches
 * Uses the same approach as TileHuggingMesh but for flood visualization
 */
export default class HuggingFloodPlane extends RenderableObject3D {
	public mesh: AbstractMesh = null;
	private color: [number, number, number];

	public constructor(color: [number, number, number] = [0, 1, 1]) {
		super();
		this.color = color;

		// Set bounding box
		this.setBoundingBox(
			new Vec3(-50, 0, -37.5),
			new Vec3(50, 1, 37.5)
		);
	}

	public isMeshReady(): boolean {
		return this.mesh !== null;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (this.mesh) {
			return;
		}

		// Use exact grid cell dimensions if available, otherwise default small size
		const gridCellSize = (this as any).gridCellSize;
		const floodDepth = (this as any).floodDepth || 0; // Water depth in meters
		const w = gridCellSize ? gridCellSize.width / 2 : 5;  // Half-width for positioning
		const h = gridCellSize ? gridCellSize.height / 2 : 5; // Half-height for positioning

		// Create 3D extruded flood geometry (like building roofs)
		const positions = this.create3DFloodGeometry(w, h, floodDepth);

		// Generate normals, UVs, and texture IDs for 3D geometry
		const vertexCount = positions.length / 3;
		const normals = this.generate3DFloodNormals(vertexCount, floodDepth);
		const uvs = this.generate3DFloodUVs(vertexCount);
		const textureIds = this.generate3DFloodTextureIds(vertexCount);

		// Create mesh with same attributes as TileHuggingMesh
		this.mesh = renderer.createMesh({
			attributes: [
				renderer.createAttribute({
					name: 'position',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: positions
					})
				}),
				renderer.createAttribute({
					name: 'normal',
					size: 3,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: normals
					})
				}),
				renderer.createAttribute({
					name: 'uv',
					size: 2,
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: uvs
					})
				}),
				renderer.createAttribute({
					name: 'textureId',
					size: 1,
					type: RendererTypes.AttributeType.UnsignedByte,
					format: RendererTypes.AttributeFormat.Integer,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: textureIds
					})
				})
			]
		});
	}

	public dispose(): void {
		if (this.mesh) {
			this.mesh.getAttribute('position').buffer.delete();
			this.mesh.getAttribute('normal').buffer.delete();
			this.mesh.getAttribute('uv').buffer.delete();
			this.mesh.getAttribute('textureId').buffer.delete();
			this.mesh.delete();
		}
	}

	/**
	 * Get the flood color for this plane
	 */
	public getFloodColor(): [number, number, number] {
		return this.color;
	}



	/**
	 * Create flood geometry using EXACT same method as roads
	 * Roads use projectGeometryOnTerrain with height parameter - we must do the same
	 */
	private create3DFloodGeometry(halfWidth: number, halfHeight: number, depth: number): Float32Array {
		// Create FLAT geometry (Y=0) for terrain hugging - let vertex shader handle terrain displacement
		// This is how farms/beaches work - flat geometry that hugs terrain via shader
		return new Float32Array([
			// Triangle 1
			-halfWidth, 0, -halfHeight,  // Bottom-left
			 halfWidth, 0, -halfHeight,  // Bottom-right
			-halfWidth, 0,  halfHeight,  // Top-left

			// Triangle 2
			 halfWidth, 0, -halfHeight,  // Bottom-right
			 halfWidth, 0,  halfHeight,  // Top-right
			-halfWidth, 0,  halfHeight   // Top-left
		]);
	}

	/**
	 * Generate normals for 3D flood geometry
	 */
	private generate3DFloodNormals(vertexCount: number, depth: number): Float32Array {
		const normals = new Float32Array(vertexCount * 3);

		if (depth <= 0.01) {
			// Flat surface - all normals point up
			for (let i = 0; i < vertexCount; i++) {
				normals[i * 3] = 0;     // x
				normals[i * 3 + 1] = 1; // y (up)
				normals[i * 3 + 2] = 0; // z
			}
		} else {
			// 3D surface - top surface normals point up
			// For simplicity, all normals point up (water surface effect)
			for (let i = 0; i < vertexCount; i++) {
				normals[i * 3] = 0;     // x
				normals[i * 3 + 1] = 1; // y (up)
				normals[i * 3 + 2] = 0; // z
			}
		}

		return normals;
	}

	/**
	 * Generate UV coordinates for 3D flood geometry
	 */
	private generate3DFloodUVs(vertexCount: number): Float32Array {
		const uvs = new Float32Array(vertexCount * 2);

		// Simple UV mapping for water surface effect
		for (let i = 0; i < vertexCount; i++) {
			uvs[i * 2] = (i % 3) === 0 ? 0 : 1;     // u
			uvs[i * 2 + 1] = (i % 3) < 2 ? 0 : 1;   // v
		}

		return uvs;
	}

	/**
	 * Generate texture IDs for 3D flood geometry
	 */
	private generate3DFloodTextureIds(vertexCount: number): Uint8Array {
		const textureIds = new Uint8Array(vertexCount);
		// Use special textureId for flood water (can be overridden by setting textureId property)
		const floodTextureId = (this as any).textureId || 0; // Default to 0 (normal water) if not set
		textureIds.fill(floodTextureId);
		return textureIds;
	}
}
