define(['views/fields/float'], Dep => class extends Dep {
	override listTemplate = 'autocrm:fields/percentage/list';
	override detailTemplate = 'autocrm:fields/percentage/detail';

	override data() {
		return {
			...super.data(),
			isNotNull: this.model.get(this.name) !== null,
		};
	}
});
