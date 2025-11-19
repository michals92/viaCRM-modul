define(['views/modals/select-records'], Dep => class extends Dep {
	override multiple = false;
	override createButton = false;
	override searchPanel = false;
	override scope = 'RecordTemplate';

	override setupSearch() {
		this.filters = {
			entityType: {
				type: 'equals',
				value: this.options.entityType,
			},
		};

		super.setupSearch();
	}
});