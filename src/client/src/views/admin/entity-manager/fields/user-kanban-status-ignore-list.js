define(['views/fields/multi-enum'], Dep => class extends Dep {
	setupOptions() {
		const options = this.getMetadata().get(['entityDefs', this.model.get('name'), 'fields', this.model.get('statusField'), 'options'], []);

		this.params.options = options;

		this.translatedOptions = this.getLanguage().get(this.model.get('name'), 'options', this.model.get('statusField'));
	}
});
