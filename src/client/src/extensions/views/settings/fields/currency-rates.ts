import type CurrencyRatesView from 'espocrm/src/views/settings/fields/currency-rates';
import type DateFieldView from 'espocrm/src/views/fields/date';
import type Model from 'espocrm/src/model';
import type { CurrencyRatesFieldData } from 'viacrm/types';

interface SelectRecordsModal {
	render(): void;
}

interface CurrencyRateHistoryModel extends Model {
	get(name: 'rate'): number;
	get(name: 'createdAt'): string;
	get(name: string): unknown;
}

extend<CurrencyRatesView>(
	['views/fields/date'],
	(Dep, DateField: typeof DateFieldView) => class extends Dep {
		override editTemplate = 'viacrm:settings/fields/currency-rates/edit';
		decimalSeparator!: string;
		name!: string;
		model!: Model;
		events!: Record<string, (e: JQuery.TriggeredEvent) => void>;

		setup(): void {
			super.setup();

			this.decimalSeparator = (this.getConfig().get('currencyRateDecimalSeparator') as string) || '.';

			this.events['click [data-action="selectCurrency"]'] = (e: JQuery.TriggeredEvent) => {
				const $el = $(e.currentTarget as HTMLElement);

				const currency = $el.data('currency') as string;

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
					(view: SelectRecordsModal) => {
						view.render();

						this.listenToOnce(view, 'select', (model: CurrencyRateHistoryModel) => {
							this.clearView('dialog');

							let rate: string | number = model.get('rate');

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

		override data(): CurrencyRatesFieldData {
			const baseCurrency = this.model.get('baseCurrency') as string;
			const currencyRates = (this.model.get('currencyRates') || {}) as Record<string, number>;

			const rateValues: Record<string, string | number> = {};

			((this.model.get('currencyList') || []) as string[]).forEach((currency: string) => {
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

		override fetch(): Record<string, Record<string, number>> {
			const data: Record<string, Record<string, number>> = {};
			const currencyRates: Record<string, number> = {};

			const baseCurrency = this.model.get('baseCurrency') as string;
			const currencyList = (this.model.get('currencyList') || []) as string[];

			currencyList.forEach((currency: string) => {
				if (currency !== baseCurrency) {
					let value = (this.$el.find(`input[data-currency="${currency}"]`).val() as string) || '1';

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
	},
);
