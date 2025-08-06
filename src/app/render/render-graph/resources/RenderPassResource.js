import * as RG from "~/lib/render-graph";

export default class RenderPassResource extends RG.Resource {
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
