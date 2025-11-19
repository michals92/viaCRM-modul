extend(Dep => class extends Dep {
	detailTemplate = 'autocrm:fields/int/detail';
	listTemplate = 'autocrm:fields/int/list';

	data() {
		return {
			...super.data(),
			useUnits: this.params.useUnits,
			unit: this.params.unit,
		};
	}
});
