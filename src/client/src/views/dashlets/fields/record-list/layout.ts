define(['views/fields/enum'], Dep => class extends Dep {
	override setupOptions() {
		const entityType = this.model.get('entityType');
		const additionalLayouts = this.getMetadata().get(['clientDefs', entityType, 'additionalLayouts']) || [];

		const options = ['listSmall', 'list'];
			
		for (const key in additionalLayouts) {
			if (['list', 'listSmall'].includes(additionalLayouts[key].type)) {
				options.push(key);
			}
		}

		this.params.options = options;
		this.params.translation = 'Admin.layouts';
	}
});
