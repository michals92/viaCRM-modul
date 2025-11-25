extend(['views/fields/date'], (Dep, DateField) => class extends Dep {
	editTemplate = 'viacrm:settings/fields/currency-rates/edit';

	setup() {
		super.setup();
			
		this.decimalSeparator = this.getConfig().get('currencyRateDecimalSeparator', '.');

		this.events['click [data-action="selectCurrency"]'] = e => {
			const $el = $(e.currentTarget);

			const currency = $el.data('currency');

			this.createView(
				'modal',
				'views/modals/select-records',
				{
					entityType: 'CurrencyRateHistoryRecord',
					multiple: false,
					filters: {
						name: {
							value: currency,
							type: 'equals',
							data: {
								type: 'equals',
							},
						},
					},
				},
				view => {
					view.render();

					this.listenToOnce(view, 'select', model => {
						this.clearView('dialog');

						let rate = model.get('rate');
							
						// Format with the configured decimal separator
						if (this.decimalSeparator === ',') {
							rate = String(rate).replace('.', ',');
						}
							
						this.$el.find(`input[data-currency="${currency}"]`).val(rate);

						const dateFormatted = DateField.prototype.convertDateValueForDetail.call(
							this,
							model.get('createdAt'),
						);

						this.$el
							.find(`input.main-element.form-control[data-for-currency="${currency}"]`)
							.val(dateFormatted);
					});
				},
			);
		};
	}
		
	data() {
		const baseCurrency = this.model.get('baseCurrency');
		const currencyRates = this.model.get('currencyRates') || {};

		const rateValues = {};

		(this.model.get('currencyList') || []).forEach(currency => {
			if (currency !== baseCurrency) {
				rateValues[currency] = currencyRates[currency];

				if (!rateValues[currency]) {
					if (currencyRates[baseCurrency]) {
						rateValues[currency] = Math.round(1 / currencyRates[baseCurrency] * 1000) / 1000;
					}

					if (!rateValues[currency]) {
						rateValues[currency] = 1.00;
					}
				}
					
				// Format with the configured decimal separator
				if (this.decimalSeparator === ',') {
					rateValues[currency] = String(rateValues[currency]).replace('.', ',');
				}
			}
		});

		return {
			rateValues,
			baseCurrency,
		};
	}
		
	fetch() {
		const data = {};
		const currencyRates = {};

		const baseCurrency = this.model.get('baseCurrency');
		const currencyList = this.model.get('currencyList') || [];

		currencyList.forEach(currency => {
			if (currency !== baseCurrency) {
				let value = this.$el.find(`input[data-currency="${currency}"]`).val() || '1';
					
				// Replace comma with dot if comma is the decimal separator
				if (this.decimalSeparator === ',') {
					value = value.replace(',', '.');
				}

				currencyRates[currency] = parseFloat(value);
			}
		});

		delete currencyRates[baseCurrency];

		for (const c in currencyRates) {
			if (!~currencyList.indexOf(c)) {
				delete currencyRates[c];
			}
		}

		data[this.name] = currencyRates;

		return data;
	}
});
