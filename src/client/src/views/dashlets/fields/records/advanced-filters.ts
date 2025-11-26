define(['autocrm:views/fields/advanced-filters'], Dep => class extends Dep {
	setup() {
		this.entityType = this.model.get('entityType');

		super.setup();

		this.listenTo(this.model, 'change:entityType', () => {
			this.entityType = this.model.get('entityType');

			this.loadFilters()
				.then(() => this.reRender())
				.then(() => this.fetchToModel());
		});
	}
});
