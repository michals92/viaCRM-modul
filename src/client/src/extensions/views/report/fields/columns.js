extend(Dep => class extends Dep {
	setup() {
		// Ensure lists are independent for this instance
		this.fieldTypeList = (this.fieldTypeList || []).slice();
		this.numericFieldTypeList = (this.numericFieldTypeList || []).slice();

		const toAdd = [
			'floatWithLinkedUnit',
			'floatCurrency',
			'intWithUnit',
			'floatWithUnit',
		];

		const addAll = (arr, items) => {
			items.forEach(t => {
				if (!arr.includes(t)) arr.push(t);
			});
		};

		// Allow as selectable columns
		addAll(this.fieldTypeList, toAdd);
		// Treat as numeric to enable aggregates and numeric behaviors
		addAll(this.numericFieldTypeList, toAdd);

		return super.setup();
	}
});
