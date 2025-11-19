define(['views/fields/varchar'], Dep => class extends Dep {
	override detailTemplate = 'autocrm:fields/varchar-email/detail';
	override listTemplate = 'autocrm:fields/varchar-email/list';
});