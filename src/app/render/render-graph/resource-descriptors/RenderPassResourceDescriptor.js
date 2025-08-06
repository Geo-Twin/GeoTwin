import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default class RenderPassResourceDescriptor {
	constructor({
		colorAttachments,
		depthAttachment = null
	}) {
		this.colorAttachments = colorAttachments;
		this.depthAttachment = depthAttachment;
	}

	deserializeAttachment(attachment) {
		if (!attachment) {
			return null;
		}

		return JSON.stringify({...attachment, texture: attachment.texture.deserialize()});
	}

	deserialize() {
		const colorAttachmentsStr = this.colorAttachments.map(attachment => this.deserializeAttachment(attachment));
		const depthAttachmentStr = this.deserializeAttachment(this.depthAttachment);

		return JSON.stringify({
			colorAttachments: colorAttachmentsStr,
			depthAttachment: depthAttachmentStr
		});
	}
}
