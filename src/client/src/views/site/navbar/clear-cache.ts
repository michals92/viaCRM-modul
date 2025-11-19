define(['autocrm:views/site/navbar/admin-only'], (Dep: typeof import('espocrm/src/view').default) => class extends Dep {
	override template = 'autocrm:site/navbar/clear-cache';

	override setup() {
		this.addActionHandler('clearCache', () => {
			Espo.Ui.notifyWait();

			Espo.Ajax.postRequest('Admin/clearCache').then(() => {
				Espo.Ui.success(this.translate('Cache has been cleared'));

				window.location.reload();
			});
		});
	}
});
