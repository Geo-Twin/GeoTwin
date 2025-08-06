import TexturePhysicalResourceBuilder from "./physical-resource-builders/TexturePhysicalResourceBuilder";
import RenderPassPhysicalResourceBuilder from "./physical-resource-builders/RenderPassPhysicalResourceBuilder";
import TextureResource from "./resources/TextureResource";
import RenderPassResource from "./resources/RenderPassResource";
import TextureResourceDescriptor from "./resource-descriptors/TextureResourceDescriptor";
import RenderPassResourceDescriptor from "./resource-descriptors/RenderPassResourceDescriptor";

export default class RenderGraphResourceFactory {
	constructor(renderer) {
		this.textureBuilder = new TexturePhysicalResourceBuilder(renderer);
		this.renderPassBuilder = new RenderPassPhysicalResourceBuilder(renderer, this.textureBuilder);
	}

	createTextureResource({
		name,
		descriptor,
		isTransient,
		isUsedExternally
	}) {
		return new TextureResource(name, descriptor, this.textureBuilder, isTransient, isUsedExternally);
	}

	createRenderPassResource({
		name,
		descriptor,
		isTransient,
		isUsedExternally
	}) {
		return new RenderPassResource(name, descriptor, this.renderPassBuilder, isTransient, isUsedExternally);
	}
}
