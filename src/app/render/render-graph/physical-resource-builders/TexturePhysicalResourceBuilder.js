import * as RG from "~/lib/render-graph";
import {TextureResourceType} from "../resource-descriptors/TextureResourceDescriptor";

export default class TexturePhysicalResourceBuilder extends RG.PhysicalResourceBuilder {
	constructor(renderer) {
		super();
		this.renderer = renderer;
	}

	createFromResourceDescriptor(descriptor) {
		switch (descriptor.type) {
			case TextureResourceType.Texture2D: {
				return this.renderer.createTexture2D({...descriptor});
			}
			case TextureResourceType.TextureCube: {
				return this.renderer.createTextureCube({...descriptor});
			}
			case TextureResourceType.Texture2DArray: {
				return this.renderer.createTexture2DArray({...descriptor});
			}
			case TextureResourceType.Texture3D: {
				return this.renderer.createTexture3D({...descriptor});
			}
		}
	}
}
