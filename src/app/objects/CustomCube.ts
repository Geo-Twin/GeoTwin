import RenderableObject3D from '~/app/objects/RenderableObject3D';
import AbstractMesh from '~/lib/renderer/abstract-renderer/AbstractMesh';
import AbstractRenderer from '~/lib/renderer/abstract-renderer/AbstractRenderer';
import {RendererTypes} from '~/lib/renderer/RendererTypes';
import Vec3 from '~/lib/math/Vec3';
import AABB3D from '~/lib/math/AABB3D';

const vertices: number[] = [
	-1.0, -1.0, -1.0,
	-1.0, -1.0, 1.0,
	-1.0, 1.0, 1.0,
	1.0, 1.0, -1.0,
	-1.0, -1.0, -1.0,
	-1.0, 1.0, -1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, -1.0,
	1.0, -1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, -1.0, -1.0,
	-1.0, -1.0, -1.0,
	-1.0, -1.0, -1.0,
	-1.0, 1.0, 1.0,
	-1.0, 1.0, -1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, 1.0,
	-1.0, -1.0, -1.0,
	-1.0, 1.0, 1.0,
	-1.0, -1.0, 1.0,
	1.0, -1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, -1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, -1.0, -1.0,
	1.0, 1.0, 1.0,
	1.0, -1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, 1.0, -1.0,
	-1.0, 1.0, -1.0,
	1.0, 1.0, 1.0,
	-1.0, 1.0, -1.0,
	-1.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
	-1.0, 1.0, 1.0,
	1.0, -1.0, 1.0
];

export default class CustomCube extends RenderableObject3D {
	public mesh: AbstractMesh = null;

	public constructor() {
		super();

		const size = 50;
		this.boundingBox = new AABB3D(new Vec3(-1, -1, -1), new Vec3(1, 1, 1));
		this.scale.set(size, size, size);
	}

	public isMeshReady(): boolean {
		return this.mesh !== null;
	}

	public updateMesh(renderer: AbstractRenderer): void {
		if (this.mesh) {
			return;
		}
		this.mesh = renderer.createMesh({
			attributes: [
				renderer.createAttribute({
					name: 'position',
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					size: 3,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: new Float32Array(vertices)
					})
				}),
				renderer.createAttribute({
					name: 'normal',
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					size: 3,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: new Float32Array(vertices.length)
					})
				}),
				renderer.createAttribute({
					name: 'color',
					type: RendererTypes.AttributeType.UnsignedByte,
					format: RendererTypes.AttributeFormat.Float,
					size: 3,
					normalized: true,
					buffer: renderer.createAttributeBuffer({
						data: new Uint8Array(vertices.length)
					})
				}),
				renderer.createAttribute({
					name: 'uv',
					type: RendererTypes.AttributeType.Float32,
					format: RendererTypes.AttributeFormat.Float,
					size: 2,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: new Float32Array((vertices.length / 3) * 2)
					})
				}),
				renderer.createAttribute({
					name: 'textureId',
					type: RendererTypes.AttributeType.UnsignedByte,
					format: RendererTypes.AttributeFormat.Integer,
					size: 1,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: new Uint8Array(vertices.length / 3)
					})
				}),
				renderer.createAttribute({
					name: 'localId',
					type: RendererTypes.AttributeType.UnsignedInt,
					format: RendererTypes.AttributeFormat.Integer,
					size: 1,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: new Uint32Array(vertices.length / 3)
					})
				}),
				renderer.createAttribute({
					name: 'display',
					type: RendererTypes.AttributeType.UnsignedByte,
					format: RendererTypes.AttributeFormat.Integer,
					size: 1,
					normalized: false,
					buffer: renderer.createAttributeBuffer({
						data: new Uint8Array(vertices.length / 3)
					})
				})
			]
		});
	}
}
