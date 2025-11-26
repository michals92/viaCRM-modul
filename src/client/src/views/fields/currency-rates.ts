import type CurrencyRatesFieldView from 'espocrm/src/views/settings/fields/currency-rates';
import type Model from 'espocrm/src/model';
import type { CurrencyRatesFieldData } from 'viacrm/types';

define(
	['views/settings/fields/currency-rates'],
	(Dep: typeof CurrencyRatesFieldView) => class extends Dep {
		model!: Model;

		override data(): CurrencyRatesFieldData {
			const baseCurrency = this.model.get('baseCurrency') as string;
			const currencyRates = (this.model.get('productCurrencyRates') as Record<string, number>) || {};

			const rateValues: Record<string, number> = {};

			((this.model.get('currencyList') as string[]) || []).forEach(currency => {
				if (currency !== baseCurrency) {
					rateValues[currency] = currencyRates[currency];

					if (!rateValues[currency]) {
						if (currencyRates[baseCurrency]) {
							rateValues[currency] =
								Math.round(
									(1 / currencyRates[baseCurrency]) * 1000,
								) / 1000;
						}

						if (!rateValues[currency]) {
							rateValues[currency] = 1.0;
						}
					}
				}
			});

			return {
				rateValues: rateValues,
				baseCurrency: baseCurrency,
			};
		}
	},
);
