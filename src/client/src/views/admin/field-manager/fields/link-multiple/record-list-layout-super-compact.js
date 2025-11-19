define(['views/fields/array'], Dep => class extends Dep {
	setupOptions() {
		const link = this.model.get('name');
		const foreignScope = this.getMetadata().get(['entityDefs', this.options.scope, 'links', link, 'entity']);
		const additionalLayouts = this.getMetadata().get(['clientDefs', foreignScope, 'additionalLayouts']) || [];

		const options = ['listSmall', 'list', 'detail', 'detailSmall'];

		for (const key in additionalLayouts) {
			options.push(key);
		}

		this.params.options = options;
		this.params.translation = 'Admin.layouts';

		this.translatedOptions = {};
		options.forEach(option => {
			this.translatedOptions[option] = this.getLanguage().translate(option, 'layouts', 'Admin') || option;
		});
	}
});
