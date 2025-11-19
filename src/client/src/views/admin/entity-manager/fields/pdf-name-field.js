define(['views/fields/enum'], Dep => class extends Dep {
	setupOptions() {
		const fieldDefs = this.getMetadata().get(['entityDefs', this.model.get('name'), 'fields']) || {};

		this.params.options = Object.keys(fieldDefs).filter(field => (
			fieldDefs[field].type == 'varchar' ||
					fieldDefs[field].type == 'sequenceNumber' ||
					fieldDefs[field].type == 'autoincrement' ||
					fieldDefs[field].type == 'number'
		));

		this.params.options.unshift('');
	}

	setupTranslation() {
		this.translatedOptions = {};

		for (const option of this.params.options) {
			this.translatedOptions[option] = this.getLanguage().translate(option, 'fields', this.model.get('name'));
		}
	}
});
