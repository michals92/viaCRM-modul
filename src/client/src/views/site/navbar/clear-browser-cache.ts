define(['view'], Dep => class extends Dep {
	override template = 'autocrm:site/navbar/clear-browser-cache';

	override setup() {
		this.addActionHandler('clearBrowserCache', () => {
			Espo.Ui.notifyWait();

			Espo.Ajax.postRequest('ClearBrowserCache').then(() => {
				Espo.Ui.success(this.translate('Browser cache cleared'));

				window.location.reload();
			});
		});
	}
});
