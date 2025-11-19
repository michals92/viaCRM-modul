import type ListView from "espocrm/src/views/list";

define(['action-handler'], Dep => class extends Dep<ListView> {
	actionListScheduledRecurrences(_data: Record<string, any>, e: any) {
		const url = '#RecordRecurrence/list/entityType=' + this.view.scope;

		if (e.button === 1) {
			// Middle mouse button click
			window.open(url, '_blank');
		} else {
			this.view.getRouter().navigate(url, {
				trigger: true,
			});
		}
	}

	init() {
		if (!this.view.getConfig().get('showListScheduledRecurrencesButton')) {
			this.view.hideHeaderActionItem('listScheduledRecurrences');
		} else {
			const recurringRecordsEntityList =
					this.view
						.getHelper()
						.getAppParam<string[]>('recurringRecordsEntityList') || [];

			if (
				recurringRecordsEntityList.includes(this.view.scope) &&
					this.view.getAcl().checkScope(this.view.scope, 'create')
			) {
				this.view.showHeaderActionItem('listScheduledRecurrences');
			} else {
				this.view.hideHeaderActionItem('listScheduledRecurrences');
			}
		}
	}
});