import * as RG from "~/lib/render-graph";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default class RenderPassPhysicalResourceBuilder extends RG.PhysicalResourceBuilder {
	constructor(renderer, textureBuilder) {
		super();
		this.renderer = renderer;
		this.textureBuilder = textureBuilder;
	}

	createFromResourceDescriptor(descriptor) {
		const colorAttachments = [];
		
		for (const colorAttachmentDescriptor of descriptor.colorAttachments) {
			const texture = this.textureBuilder.createFromResourceDescriptor(colorAttachmentDescriptor.texture);
			
			colorAttachments.push({
				texture,
				slice: colorAttachmentDescriptor.slice,
				loadOp: colorAttachmentDescriptor.loadOp,
				storeOp: colorAttachmentDescriptor.storeOp,
				clearValue: colorAttachmentDescriptor.clearValue
			});
		}

		let depthAttachment = null;
		
		if (descriptor.depthAttachment) {
			const texture = this.textureBuilder.createFromResourceDescriptor(descriptor.depthAttachment.texture);
			
			depthAttachment = {
				texture,
				slice: descriptor.depthAttachment.slice,
				loadOp: descriptor.depthAttachment.loadOp,
				storeOp: descriptor.depthAttachment.storeOp,
				clearValue: descriptor.depthAttachment.clearValue
			};
		}

		return this.renderer.createRenderPass({
			colorAttachments,
			depthAttachment
		});
	}
}
