define(['views/fields/varchar'], Dep => class extends Dep {
	override detailTemplate = 'viacrm:fields/varchar-email/detail';
	override listTemplate = 'viacrm:fields/varchar-email/list';
});