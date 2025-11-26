define(['views/fields/varchar', 'autocrm:helpers/zive-firmy-integration'], (Dep, ZiveFirmyIntegration) => class extends Dep {
	override editTemplate = 'autocrm:account/fields/sic-code/edit';

	override setup() {
		this.events['click .sic-fill-provider'] = (e) => {
			e.preventDefault();
			const providerId = e.currentTarget.getAttribute('data-provider-id');
			this.actionFillFromProvider(providerId);
		};

		super.setup();

		// Setup ziveFirmy SIC code listener with Account field mappings
		ZiveFirmyIntegration.setupSicCodeListener(this, {
			addressStreetField: 'billingAddressStreet',
			addressCityField: 'billingAddressCity',
			addressPostalCodeField: 'billingAddressPostalCode',
			addressStateField: 'billingAddressState'
		});
	}

	override data() {
		const data = super.data();
		const providers = this.getProviders();
		data.providers = providers;
		data.providersEnabled = providers.length > 0;
		return data;
	}

	getProviders() {
		const providers = [];

		if (this.getConfig().get('aresEnabled')) {
			providers.push({
				id: 'Ares',
				label: this.translate('Ares', 'fillProviders', 'Account'),
			});
		}

		if (this.getConfig().get('finstatEnabled')) {
			providers.push({
				id: 'Finstat',
				label: this.translate('Finstat', 'fillProviders', 'Account'),
			});
		}

		return providers;
	}

	async actionFillFromProvider(providerId) {
		const sicCode = this.model.get(this.name);

		if (!sicCode) {
			Espo.Ui.warning(this.translate('missingSicCode', 'messages', 'Account'));
			return;
		}

		Espo.Ui.notifyWait();

		try {
			const response = await Espo.Ajax.getRequest(`${providerId}/fill/${sicCode}`);
			Espo.Ui.notify(false);
			this.process(response);
		} catch (e) {
			Espo.Ui.notify(false);
			Espo.Ui.error(this.translate(`invalid${providerId}Response`, 'messages', 'Account'));
			console.error(e);
		}
	}

	process(data) {
		const includeHouseNumbers = this.getConfig().get('aresIncludeHouseNumbersInAddress') !== false;

		for (const [key, value] of Object.entries(data.attributes)) {
			// Handle mapping from Lead-style field names to Account field names
			if (key === 'name') {
				this.model.set('name', value);
				continue;
			}

			if (key.startsWith('billing')) {
				// For Account, we keep billing prefix (unlike Lead which removes it)
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
			} else {
				this.model.set(key, value);
			}
		}
	}
});