import type LinkManagerEditModalView from 'espocrm/src/views/admin/link-manager/modals/edit';

extend<LinkManagerEditModalView>(Dep => class extends Dep {
	override populateFields(): void {
		super.populateFields();

		const entity = this.model.get('entity') as string;
		const entityForeign = this.model.get('entityForeign') as string;

		const linkType = this.model.get('linkType') as string;

		let label: string | undefined, labelForeign: string | undefined;

		if (linkType === 'oneToMany' || linkType === 'manyToMany') {
			label = this.getLanguage().translate(entityForeign, 'scopeNamesPlural') as string;
			labelForeign = this.getLanguage().translate(entity, 'scopeNamesPlural') as string;
		} else {
			label = this.getLanguage().translate(entityForeign, 'scopeNames') as string;
			labelForeign = this.getLanguage().translate(entity, 'scopeNames') as string;
		}

		this.model.set('label', label || null);
		this.model.set('labelForeign', labelForeign || null);
	}
});
