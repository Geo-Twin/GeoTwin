import ResourceLoader from "~/app/world/ResourceLoader";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default function createProjectedMeshTexture(renderer) {
	return renderer.createTexture2DArray({
		width: 512,
		height: 512,
		depth: 39 * 3,
		anisotropy: 16,
		data: [
			ResourceLoader.get('pavementDiffuse'),
			ResourceLoader.get('commonNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('asphaltDiffuse'),
			ResourceLoader.get('asphaltNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('cobblestoneDiffuse'),
			ResourceLoader.get('cobblestoneNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('footballPitchDiffuse'),
			ResourceLoader.get('commonNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('gravelDiffuse'),
			ResourceLoader.get('gravelNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('grassDiffuse'),
			ResourceLoader.get('grassNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('sandDiffuse'),
			ResourceLoader.get('sandNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('concreteDiffuse'),
			ResourceLoader.get('concreteNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('tileDiffuse'),
			ResourceLoader.get('tileNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('woodDiffuse'),
			ResourceLoader.get('woodNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('metalDiffuse'),
			ResourceLoader.get('metalNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('rockDiffuse'),
			ResourceLoader.get('rockNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('mudDiffuse'),
			ResourceLoader.get('mudNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('clayDiffuse'),
			ResourceLoader.get('clayNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('tarDiffuse'),
			ResourceLoader.get('tarNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('rubberDiffuse'),
			ResourceLoader.get('rubberNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('plasticDiffuse'),
			ResourceLoader.get('plasticNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('glassDiffuse'),
			ResourceLoader.get('glassNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('fabricDiffuse'),
			ResourceLoader.get('fabricNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('leatherDiffuse'),
			ResourceLoader.get('leatherNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('paperDiffuse'),
			ResourceLoader.get('paperNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('foamDiffuse'),
			ResourceLoader.get('foamNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('carbonFiberDiffuse'),
			ResourceLoader.get('carbonFiberNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('ceramicDiffuse'),
			ResourceLoader.get('ceramicNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('marbleDiffuse'),
			ResourceLoader.get('marbleNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('graniteGrayDiffuse'),
			ResourceLoader.get('graniteGrayNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('graniteRedDiffuse'),
			ResourceLoader.get('graniteRedNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('graniteBlackDiffuse'),
			ResourceLoader.get('graniteBlackNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('limestoneDiffuse'),
			ResourceLoader.get('limestoneNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('sandstoneDiffuse'),
			ResourceLoader.get('sandstoneNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('slateDiffuse'),
			ResourceLoader.get('slateNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('quartziteDiffuse'),
			ResourceLoader.get('quartziteNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('basaltDiffuse'),
			ResourceLoader.get('basaltNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('porphyryDiffuse'),
			ResourceLoader.get('porphyryNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('gneissDiffuse'),
			ResourceLoader.get('gneissNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('schistDiffuse'),
			ResourceLoader.get('schistNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('travertineDiffuse'),
			ResourceLoader.get('travertineNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('onyxDiffuse'),
			ResourceLoader.get('onyxNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('alabasterDiffuse'),
			ResourceLoader.get('alabasterNormal'),
			ResourceLoader.get('commonMask'),

			ResourceLoader.get('serpentineDiffuse'),
			ResourceLoader.get('serpentineNormal'),
			ResourceLoader.get('commonMask'),

		],
		minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
		magFilter: RendererTypes.MagFilter.Linear,
		wrap: RendererTypes.TextureWrap.Repeat,
		format: RendererTypes.TextureFormat.RGBA8Unorm,
		mipmaps: true,
		flipY: true
	});
}
