define(['autocrm:views/site/navbar/admin-only'], (Dep: typeof import('espocrm/src/view').default) => class extends Dep {
	override template = 'autocrm:site/navbar/rebuild';

	override setup() {
		this.addActionHandler('rebuild', () => {
			Espo.Ui.notifyWait();

			Espo.Ajax.postRequest('Admin/rebuild').then(() => {
				Espo.Ui.success(this.translate('Rebuild has been done'));

				window.location.reload();
			});
		});
	}
});
