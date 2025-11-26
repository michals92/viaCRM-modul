define(['views/fields/enum'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.listenTo(
			this.model,
			'change:entityType',
			() => {
				this.setupOptions();
				this.reRender();
			},
			this,
		);
	}

	override setupOptions() {
		const entityType = this.model.get('entityType');

		if (!entityType) {
			this.params.options = [];
			return;
		}

		const fields = this.getMetadata().get(['entityDefs', entityType, 'fields']) || {};
		this.params.options = Object.keys(fields).filter(
			fieldName => fields[fieldName].type === 'attachmentMultiple',
		);

		if (this.params.options.length > 0) {
			this.model.set(this.name, this.params.options[0]);
		}

		// Translate field names
		this.translatedOptions = {};

		this.params.options.forEach(option => {
			this.translatedOptions[option] = this.translate(option, 'fields', entityType);
		});
	}

	override fetch() {
		const data = super.fetch();

		if (data[this.name] === '') {
			data[this.name] = null;
		}

		return data;
	}
});
