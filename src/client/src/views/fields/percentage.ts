define(['views/fields/float'], Dep => class extends Dep {
	override listTemplate = 'viacrm:fields/percentage/list';
	override detailTemplate = 'viacrm:fields/percentage/detail';

	override data() {
		return {
			...super.data(),
			isNotNull: this.model.get(this.name) !== null,
		};
	}
});
