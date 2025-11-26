import type _default from 'espocrm/src/views/email/fields/select-template';

extend<_default>(Dep => class extends Dep {
	getSelectFilters(): Record<string, unknown> | null {
		return this.getMetadata().get(['clientDefs', 'EmailTemplate', 'defaultSelectFilters'], null) as Record<string, unknown> | null;
	}
});
