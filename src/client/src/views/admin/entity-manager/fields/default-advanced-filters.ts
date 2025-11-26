define(['autocrm:views/fields/advanced-filters'], Dep => class extends Dep {
	setup() {
		this.entityType = this.model.get('name');

		super.setup();
	}
});
