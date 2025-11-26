import type FieldManagerListView from 'espocrm/src/views/admin/field-manager/list';

extend<FieldManagerListView>(Dep => class extends Dep {
	override template = 'viacrm:admin/field-manager/list';
});
