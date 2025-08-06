import {RendererTypes} from "~/lib/renderer/RendererTypes";

export const TextureResourceType = {
	Texture2D: 0,
	TextureCube: 1,
	Texture2DArray: 2,
	Texture3D: 3
};

export default class TextureResourceDescriptor {
	constructor({
		type,
		width,
		height,
		depth = 1,
		anisotropy = 1,
		minFilter = RendererTypes.MinFilter.LinearMipmapLinear,
		magFilter = RendererTypes.MagFilter.Linear,
		wrap = RendererTypes.TextureWrap.ClampToEdge,
		wrapS = wrap,
		wrapT = wrap,
		wrapR = wrap,
		format = RendererTypes.TextureFormat.RGBA8Unorm,
		flipY = false,
		mipmaps = false,
		isImmutable = false,
		immutableLevels
	}) {
		this.type = type;
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.anisotropy = anisotropy;
		this.minFilter = minFilter;
		this.magFilter = magFilter;
		this.wrap = wrap;
		this.wrapS = wrapS;
		this.wrapT = wrapT;
		this.wrapR = wrapR;
		this.format = format;
		this.flipY = flipY;
		this.mipmaps = mipmaps;
		this.isImmutable = isImmutable;
		this.immutableLevels = immutableLevels;
	}

	setSize(width, height, depth = 1) {
		this.width = width;
		this.height = height;
		this.depth = depth;
	}

	deserialize() {
		return JSON.stringify([
			this.width,
			this.height,
			this.depth,
			this.anisotropy,
			this.minFilter,
			this.magFilter,
			this.wrap,
			this.format,
			this.flipY,
			this.mipmaps
		]);
	}
}
