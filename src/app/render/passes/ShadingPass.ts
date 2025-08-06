import Pass from "./Pass";
import * as RG from "~/lib/render-graph";
import {InternalResourceType} from "~/lib/render-graph";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import PassManager from "../PassManager";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ShadingMaterialContainer from "../materials/ShadingMaterialContainer";
import AbstractTexture3D from "~/lib/renderer/abstract-renderer/AbstractTexture3D";
import Vec3 from "~/lib/math/Vec3";
import AbstractTextureCube from "~/lib/renderer/abstract-renderer/AbstractTextureCube";
import TextureResource from "../render-graph/resources/TextureResource";

export default class ShadingPass extends Pass<{
	GBuffer: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	// GeoTwin: ShadowMaps and SSAO resources removed for performance
	SelectionMask: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	SelectionBlurred: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	HDR: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
	SkyViewLUT: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	AerialPerspectiveLUT: {
		type: InternalResourceType.Input;
		resource: TextureResource;
	};
	TransmittanceLUT: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	AtmosphereSkybox: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	// GeoTwin: SSR resource removed for performance
}> {
	private readonly shadingMaterial: AbstractMaterial;
	private readonly fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('ShadingPass', manager, {
			GBuffer: {type: RG.InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			// GeoTwin: ShadowMaps and SSAO resources removed for performance
			SelectionMask: {type: InternalResourceType.Input, resource: manager.getSharedResource('SelectionMask')},
			SelectionBlurred: {type: InternalResourceType.Input, resource: manager.getSharedResource('SelectionBlurred')},
			HDR: {type: InternalResourceType.Output, resource: manager.getSharedResource('HDR')},
			SkyViewLUT: {type: InternalResourceType.Input, resource: manager.getSharedResource('SkyViewLUT')},
			AerialPerspectiveLUT: {type: InternalResourceType.Input, resource: manager.getSharedResource('AerialPerspectiveLUT')},
			TransmittanceLUT: {type: InternalResourceType.Input, resource: manager.getSharedResource('AtmosphereTransmittanceLUT')},
			AtmosphereSkybox: {type: InternalResourceType.Input, resource: manager.getSharedResource('AtmosphereSkybox')},
			// GeoTwin: SSR resource removed for performance optimization
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
		this.shadingMaterial = new ShadingMaterialContainer(this.renderer).material;
	}

	// GeoTwin: Shadow, SSAO, and SSR texture getters removed for performance optimization

	// GeoTwin: Material defines update removed - no dynamic shader compilation needed

	public render(): void {
		// GeoTwin: Simplified render method - no dynamic shader compilation needed

		const camera = this.manager.sceneSystem.objects.camera;
		const sunDirection = new Float32Array([...Vec3.toArray(this.manager.mapTimeSystem.sunDirection)]);
		const skyDirectionMatrix = new Float32Array(this.manager.mapTimeSystem.skyDirectionMatrix.values);

		const colorTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[0].texture;
		const normalTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[1].texture;
		const depthTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').depthAttachment.texture;
		const roughnessMetalnessTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[2].texture;
		const glowTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[5].texture;
		const motionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[3].texture;
		const selectionMaskTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionMask').colorAttachments[0].texture;
		const selectionBlurredTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionBlurred').colorAttachments[0].texture;
		const aerialPerspectiveLUT = <AbstractTexture3D>this.getPhysicalResource('AerialPerspectiveLUT');
		const transmittanceLUT = <AbstractTexture3D>this.getPhysicalResource('TransmittanceLUT').colorAttachments[0].texture;
		const atmosphereSkyboxTexture = <AbstractTextureCube>this.getPhysicalResource('AtmosphereSkybox').colorAttachments[0].texture;

		// GeoTwin: CSM and removed texture resources no longer needed

		this.renderer.beginRenderPass(this.getPhysicalResource('HDR'));

		this.shadingMaterial.getUniform('tColor').value = colorTexture;
		this.shadingMaterial.getUniform('tNormal').value = normalTexture;
		this.shadingMaterial.getUniform('tDepth').value = depthTexture;
		this.shadingMaterial.getUniform('tRoughnessMetalness').value = roughnessMetalnessTexture;
		this.shadingMaterial.getUniform('tGlow').value = glowTexture;
		// GeoTwin: Shadow and SSAO texture uniforms removed for performance
		this.shadingMaterial.getUniform('tSelectionMask').value = selectionMaskTexture;
		this.shadingMaterial.getUniform('tSelectionBlurred').value = selectionBlurredTexture;
		this.shadingMaterial.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorld.values);
		this.shadingMaterial.getUniform('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.projectionMatrixInverse.values);
		this.shadingMaterial.getUniform('projectionMatrixInverseJittered', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrixInverse.values);
		this.shadingMaterial.getUniform('sunDirection', 'MainBlock').value = sunDirection;
		this.shadingMaterial.getUniform('tAerialPerspectiveLUT').value = aerialPerspectiveLUT;
		this.shadingMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;
		// GeoTwin: SSR texture uniform removed for performance
		this.shadingMaterial.getUniform('tMotion').value = motionTexture;
		this.shadingMaterial.getUniform('tAtmosphere').value = atmosphereSkyboxTexture;
		this.shadingMaterial.getUniform('skyRotationMatrix', 'MainBlock').value = skyDirectionMatrix;

		// GeoTwin: CSM uniform block removed for performance optimization
		this.shadingMaterial.updateUniformBlock('MainBlock');

		this.renderer.useMaterial(this.shadingMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}