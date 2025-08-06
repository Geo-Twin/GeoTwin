import * as RG from "~/lib/render-graph";

export default class TextureResource extends RG.Resource {
	constructor(name, descriptor, physicalResourceBuilder, isTransient, isUsedExternally) {
		super({
			name,
			descriptor,
			physicalResourceBuilder,
			isTransient,
			isUsedExternally
		});
	}
}
