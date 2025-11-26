import type IntFieldView from 'espocrm/src/views/fields/int';

interface IntFieldData {
	useUnits?: boolean;
	unit?: string;
	[key: string]: unknown;
}

extend<IntFieldView>(Dep => class extends Dep {
	override detailTemplate = 'viacrm:fields/int/detail';
	override listTemplate = 'viacrm:fields/int/list';

	override data(): IntFieldData {
		return {
			...super.data(),
			useUnits: this.params.useUnits,
			unit: this.params.unit,
		};
	}
});
