import type ReportFieldsColumnsView from 'espocrm/src/modules/advanced/src/views/report/fields/columns';

extend<ReportFieldsColumnsView>(Dep => class extends Dep {
	fieldTypeList!: string[];
	numericFieldTypeList!: string[];

	setup(): void {
		// Ensure lists are independent for this instance
		this.fieldTypeList = (this.fieldTypeList || []).slice();
		this.numericFieldTypeList = (this.numericFieldTypeList || []).slice();

		const toAdd = [
			'floatWithLinkedUnit',
			'floatCurrency',
			'intWithUnit',
			'floatWithUnit',
		];

		const addAll = (arr: string[], items: string[]): void => {
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
