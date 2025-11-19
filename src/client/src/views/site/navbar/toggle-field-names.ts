define(['autocrm:views/site/navbar/admin-only'], (Dep: typeof import('espocrm/src/view').default) => class extends Dep {
	override template = 'autocrm:site/navbar/toggle-field-names';

	status: string = 'disabled';

	override setup() {
		this.status = this.getStorage().get('state', 'displayInternalFieldNames') ?? this.status;

		this.addActionHandler('toggleFieldNames', () => {
			Espo.Ui.notifyWait();
			const currentStatus = this.getStorage().get('state', 'displayInternalFieldNames') ?? 'disabled';

			let newStatus: string;
			if (currentStatus === 'disabled') {
				newStatus = 'enabled';
			}/* else if (currentStatus === 'enabled') {
					newStatus = 'hidden';
				} */ else if (currentStatus === 'hidden') {
				newStatus = 'disabled';
			} else {
				newStatus = 'disabled';
			}

			this.getStorage().set('state', 'displayInternalFieldNames', newStatus);
			this.status = newStatus;

			Espo.Ui.success(this.translate('Done'));

			window.dispatchEvent(
				new CustomEvent('displayInternalFieldNamesChanged', {
					detail: {newValue: newStatus},
				}),
			);

			this.reRender();
		});
	}

	override data() {
		const data = super.data();

		data.status = this.status;

		return data;
	}
});
