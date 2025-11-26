define(['autocrm:views/fields/advanced-filters'], Dep => class extends Dep {
	setup() {
		const link = this.model.get('name');

		this.entityType = this.getMetadata().get(['entityDefs', this.options.scope, 'links', link, 'entity']);

		super.setup();
	}
});
