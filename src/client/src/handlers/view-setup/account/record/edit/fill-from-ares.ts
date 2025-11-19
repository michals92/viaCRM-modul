import type EditRecordView from 'espocrm/src/views/record/edit';

define(() => class {
	view: EditRecordView;

	constructor(view: EditRecordView) {
		this.view = view;
	}

	getAction(provider: string): () => Promise<void> {
		return async function (this: EditRecordView) {
			const sicCode = this.model.get('sicCode');

			const includeHouseNumbers = this.getConfig().get('aresIncludeHouseNumbersInAddress') !== false;

			if (!sicCode) {
				Espo.Ui.notify(this.translate('missingSicCode', 'messages', 'Account'), 'warning');
				return;
			}

			Espo.Ui.notifyWait();

			const response = (await Espo.Ajax.getRequest(`${provider}/fill/${sicCode}`)) as any;

			Espo.Ui.notify(false);

			for (const [key, value] of Object.entries(response.attributes)) {
				if (key === 'billingAddressStreet' && typeof value === 'string') {
					if (includeHouseNumbers) {
						// Keep house numbers in the street
						this.model.set(key, value);
					} else {
						// Remove house numbers from the street
						const cleanedStreet = value.replace(/\s+\d+\/?\d*$/, '').trim();
						this.model.set(key, cleanedStreet);
					}
				} else if (key === 'billingAddressPostalCode' && typeof value === 'string') {
					// Format the postal code as 000 00
					const formattedPostalCode = value.replace(/(\d{3})(\d{2})/, '$1 $2');
					this.model.set(key, formattedPostalCode);
				} else {
					this.model.set(key, value);
				}
			}
		};
	}

	process() {
		if (this.view.getConfig().get('aresEnabled')) {
			this.view.addButton({
				name: 'fillFromAres',
				label: this.view.translate('Ares', 'fillProviders', 'Account'),
			});

			//@ts-ignore monkeypatch
			this.view.actionFillFromAres = this.getAction('Ares');
		}

		if (this.view.getConfig().get('finstatEnabled')) {
			this.view.addButton({
				name: 'fillFromFinstat',
				label: this.view.translate('Finstat', 'fillProviders', 'Account'),
			});

			//@ts-ignore monkeypatch
			this.view.actionFillFromFinstat = this.getAction('Finstat');
		}
	}
});
