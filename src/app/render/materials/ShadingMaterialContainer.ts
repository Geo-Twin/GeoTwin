import Shaders from "../shaders/Shaders";
import MaterialContainer from "./MaterialContainer";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import Config from "../../Config";

export default class ShadingMaterialContainer extends MaterialContainer {
	public constructor(renderer: AbstractRenderer) {
		super(renderer);

		// GeoTwin: Performance optimization - Create minimal uniforms for disabled features
		const baseUniforms = [
				{
					name: 'tColor',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tGlow',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tNormal',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tDepth',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tRoughnessMetalness',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSelectionMask',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tSelectionBlurred',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tAerialPerspectiveLUT',
					block: null,
					type: RendererTypes.UniformType.Texture3D,
					value: null
				}, {
					name: 'tTransmittanceLUT',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tMotion',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tAtmosphere',
					block: null,
					type: RendererTypes.UniformType.TextureCube,
					value: null
				}, {
					name: 'skyRotationMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'viewMatrix',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'projectionMatrixInverse',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'projectionMatrixInverseJittered',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Matrix4,
					value: new Float32Array()
				}, {
					name: 'sunDirection',
					block: 'MainBlock',
					type: RendererTypes.UniformType.Float3,
					value: new Float32Array()
				}
			];

		this.material = this.renderer.createMaterial({
			name: 'Shading material',
			defines: {
				// GeoTwin: Performance optimization - All advanced features disabled
			},
			uniforms: baseUniforms as any,
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.None
			},
			depth: {
				depthWrite: false,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			blend: {
				color: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				},
				alpha: {
					operation: RendererTypes.BlendOperation.Add,
					srcFactor: RendererTypes.BlendFactor.One,
					dstFactor: RendererTypes.BlendFactor.Zero
				}
			},
			vertexShaderSource: Shaders.shading.vertex,
			fragmentShaderSource: Shaders.shading.fragment
		});
	}
}
