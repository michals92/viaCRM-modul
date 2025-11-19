define(['views/fields/multi-enum'], Dep => class extends Dep {
	// TODO: Maybe figure out how to decide in general which field types are allowed instead of hardcoding
	allowedFieldTypes = ['varchar', 'int', 'link'];

	setupOptions() {
		const fieldDefs = this.getMetadata().get(['entityDefs', this.model.get('name'), 'fields']) || {};

		this.params.options = Object.keys(fieldDefs).filter(field => {
			const fieldDef = fieldDefs[field];

			return this.allowedFieldTypes.includes(fieldDef.type) && !fieldDef.hidden;
		});

		this.params.options.unshift('');
	}

	setupTranslation() {
		this.translatedOptions = {};

		for (const option of this.params.options) {
			this.translatedOptions[option] = this.getLanguage().translate(option, 'fields', this.model.get('name'));
		}
	}
});
