import type SelectRecordsView from 'espocrm/src/views/modals/select-records';

extend<SelectRecordsView>(Dep => class extends Dep {
	noCreateScopeList: string[] = ['User', 'Role', 'Portal'];
});
