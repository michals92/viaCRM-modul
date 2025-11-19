define(['views/fields/enum'], Dep => class extends Dep {
	setup() {
		super.setup();

		this.listenTo(this.model, 'change:entityType', () => {
			this.setup();
			this.reRender();
		});
	}

	setupOptions() {
		const entityType = this.entityType = this.model.get('entityType');
		const defs = this.getMetadata().get(['entityDefs', entityType, 'fields'], {});

		this.params.options = Object.keys(defs).filter(
			field => defs[field].type === 'address' && defs[field].saveCoordinates
		);
	}

	setupTranslation() {
		this.translatedOptions = {};
			
		this.params.options.forEach(
			field => this.translatedOptions[field] = this.translate(field, 'fields', this.entityType)
		);
	}
});
