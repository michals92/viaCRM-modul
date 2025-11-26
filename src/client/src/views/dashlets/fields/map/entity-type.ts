define(['views/fields/enum'], Dep => class extends Dep {
	override setupOptions() {
		const entityTypes = Object.keys(this.getMetadata().get(['scopes'])).filter(entityType => {
			const defs = this.getMetadata().get(['entityDefs', entityType, 'fields'], {});
			return Object.keys(defs).some(field => defs[field].type === 'address' && defs[field].saveCoordinates);
		});

		this.params.options = [''].concat(entityTypes);
	}

	setupTranslation() {
		this.translatedOptions = {};
		this.params.options.forEach(
			entityType => (this.translatedOptions[entityType] = this.translate(entityType, 'scopeNamesPlural')),
		);
	}
});
