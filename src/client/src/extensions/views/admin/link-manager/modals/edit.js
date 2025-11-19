extend(Dep => class extends Dep {
	populateFields() {
		super.populateFields();

		const entity = this.model.get('entity');
		const entityForeign = this.model.get('entityForeign');

		const linkType = this.model.get('linkType');

		let label, labelForeign;

		if (linkType === 'oneToMany' || linkType === 'manyToMany') {
			label = this.getLanguage().translate(entityForeign, 'scopeNamesPlural');
			labelForeign = this.getLanguage().translate(entity, 'scopeNamesPlural');
		} else {
			label = this.getLanguage().translate(entityForeign, 'scopeNames');
			labelForeign = this.getLanguage().translate(entity, 'scopeNames');
		}

		this.model.set('label', label || null);
		this.model.set('labelForeign', labelForeign || null);
	}
});
