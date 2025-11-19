define(['views/admin/layouts/rows', 'views/admin/layouts/filters'], (Dep, FiltersLayout) => class extends Dep {
	dataAttributeList = ['name'];

	editable = false;

	ignoreList = [];

	setup() {
		this.allowedTypes = [
			...new Set(Object.values(this.getMetadata().get(['aggregationFunctions'])).flatMap(func => func.types)),
		];

		FiltersLayout.prototype.setup.call(this);
	}

	loadLayout(callback) {
		FiltersLayout.prototype.loadLayout.call(this, callback);
	}

	fetch() {
		return FiltersLayout.prototype.fetch.call(this);
	}

	checkFieldType(type) {
		return this.allowedTypes.includes(type);
	}

	validate() {
		return true;
	}

	isFieldEnabled(model, name) {
		if (this.ignoreList.indexOf(name) !== -1) {
			return false;
		}

		return (
			!model.getFieldParam(name, 'disabled') &&
				!model.getFieldParam(name, 'layoutAggregationFunctionsDisabled')
		);
	}
});
