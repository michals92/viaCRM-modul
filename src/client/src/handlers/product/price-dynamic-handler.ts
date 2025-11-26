import type DynamicHandler from 'espocrm/src/dynamic-handler';
import type Model from 'espocrm/src/model';

type PricingType = 'No Price' | 'Fixed Sales Price' | 'Markup over Cost' | 'Profit Margin' | 'Same as Cost Price' | 'Purchasing Coefficient' | 'Sales Coefficient';

interface SetOptions {
	silentToDynamicHandler?: boolean;
}

define(
	['dynamic-handler'],
	(Dep: typeof DynamicHandler) => class extends Dep {
		isCalculatingPrice = false;

		pricingTypesMap: Record<PricingType, string[]> = {
			'No Price': [],
			'Fixed Sales Price': [
				'costPrice',
				'salesPrice',
				'salesPriceWithTax',
				'costPriceWithTax',
			],
			'Markup over Cost': ['costPrice', 'priceMarkup', 'costPriceWithTax'],
			'Profit Margin': ['costPrice', 'priceMargin', 'costPriceWithTax'],
			'Same as Cost Price': ['costPrice', 'costPriceWithTax'],
			'Purchasing Coefficient': [
				'coefficient',
				'salesPrice',
				'salesPriceWithTax',
			],
			'Sales Coefficient': [
				'coefficient',
				'costPrice',
				'costPriceWithTax',
			],
		};

		costPriceRequiredTypes: PricingType[] = ['Markup over Cost', 'Profit Margin'];

		roundMultiplier!: number;
		declare model: Model;
		declare recordView: {
			getConfig(): { get(key: string): unknown };
			listenTo(target: unknown, event: string, callback: (...args: unknown[]) => void): void;
			recordHelper: unknown;
			setFieldRequired(field: string): void;
			setFieldNotRequired(field: string): void;
			setFieldReadOnly(field: string): void;
			setFieldNotReadOnly(field: string): void;
		};

		override init(): void {
			this.roundMultiplier = Math.pow(
				10,
				this.recordView.getConfig().get('currencyDecimalPlaces') as number,
			);

			const defaultControl = (): void => {
				this.controlPricingType();
				this.controlPrice();
			};

			this.recordView.listenTo(
				this.recordView.recordHelper,
				'panel-show',
				defaultControl,
			);

			this.recordView.listenTo(this.model, 'change:costPrice', (_model: Model, _value: unknown, options?: SetOptions) => {
				if (options?.silentToDynamicHandler) return;
				this.calculateTaxPrices();
				this.controlPrice();
			});

			this.recordView.listenTo(this.model, 'change:salesPrice', (_model: Model, _value: unknown, options?: SetOptions) => {
				if (options?.silentToDynamicHandler) return;
				this.calculateTaxPrices();
				this.controlPrice();
			});

			this.recordView.listenTo(this.model, 'change:costPriceWithTax', (_model: Model, _value: unknown, options?: SetOptions) => {
				if (options?.silentToDynamicHandler) return;
				if (!this.isCalculatingPrice) {
					this.calculatePricesWithoutTax();
				}
			});

			this.recordView.listenTo(this.model, 'change:salesPriceWithTax', (_model: Model, _value: unknown, options?: SetOptions) => {
				if (options?.silentToDynamicHandler) return;
				if (!this.isCalculatingPrice) {
					this.calculatePricesWithoutTax();
				}
			});

			this.recordView.listenTo(this.model, 'change:taxRate', (_model: Model, _value: unknown, options?: SetOptions) => {
				if (options?.silentToDynamicHandler) return;
				this.calculateTaxPrices();
				this.controlPrice();
			});

			defaultControl();
		}

		round(val: number | null): number | null {
			return val
				? Math.round(val * this.roundMultiplier) / this.roundMultiplier
				: null;
		}

		onChangeCoefficient(): void {
			this.controlPrice();
		}

		onChangePricingType(): void {
			this.controlPricingType();
			this.controlPrice();
		}

		onChangeCostPriceCurrency(): void {
			this.model.set('costPriceWithTaxCurrency',
				this.model.get('costPriceCurrency'),
				{ silentToDynamicHandler: true },
			);
			this.controlPrice();
		}

		onChangeSalesPriceCurrency(): void {
			this.model.set('salesPriceWithTaxCurrency',
				this.model.get('salesPriceCurrency'),
				{ silentToDynamicHandler: true },
			);
			this.controlPrice();
		}

		onChangePriceMarkup(): void {
			this.controlPrice();
		}

		onChangePriceMargin(): void {
			this.controlPrice();
		}

		controlPricingType(): void {
			let pricingType = this.model.get('pricingType') as PricingType;

			if (!(pricingType in this.pricingTypesMap)) {
				pricingType = 'Fixed Sales Price';
			}

			const targetFields = this.pricingTypesMap[pricingType];

			if (this.costPriceRequiredTypes.includes(pricingType)) {
				this.recordView.setFieldRequired('costPrice');
			} else {
				this.recordView.setFieldNotRequired('costPrice');
			}

			Object.values(this.pricingTypesMap)
				.flat()
				.forEach(field => {
					if (targetFields.includes(field)) {
						this.recordView.setFieldNotReadOnly(field);
						this.recordView.setFieldRequired(field);
					} else {
						this.recordView.setFieldReadOnly(field);
						this.recordView.setFieldNotRequired(field);
					}
				});
		}

		calculateTaxPrices(): void {
			const taxRate = (this.model.get('taxRate') as number) || 0;
			const costPrice = this.model.get('costPrice') as number | null;
			const salesPrice = this.model.get('salesPrice') as number | null;

			let costPriceWithTax: number | null = null;
			let salesPriceWithTax: number | null = null;

			if (costPrice !== null) {
				costPriceWithTax = costPrice * (1 + taxRate / 100);
			}

			if (salesPrice !== null) {
				salesPriceWithTax = salesPrice * (1 + taxRate / 100);
			}

			this.model.set({
				costPriceWithTax: this.round(costPriceWithTax),
				salesPriceWithTax: this.round(salesPriceWithTax),
			}, { silentToDynamicHandler: true });
		}

		calculatePricesWithoutTax(): void {
			const taxRate = (this.model.get('taxRate') as number) || 0;
			const costPriceWithTax = this.model.get('costPriceWithTax') as number | null;
			const salesPriceWithTax = this.model.get('salesPriceWithTax') as number | null;

			let costPrice: number | null = null;
			let salesPrice: number | null = null;

			if (costPriceWithTax !== null) {
				costPrice = costPriceWithTax / (1 + taxRate / 100);
			}

			if (salesPriceWithTax !== null) {
				salesPrice = salesPriceWithTax / (1 + taxRate / 100);
			}

			this.model.set({
				costPrice: this.round(costPrice),
				salesPrice: this.round(salesPrice),
			}, { silentToDynamicHandler: true });
		}

		controlPrice(): void {
			const pricingType = this.model.get('pricingType') as PricingType;
			const costPrice = this.model.get('costPrice') as number | null;
			const costPriceCurrency = this.model.get('costPriceCurrency') as string;

			this.isCalculatingPrice = true;

			switch (pricingType) {
				case 'Fixed Sales Price': {
					const salesPrice = this.model.get('salesPrice') as number | null;
					let markup: number | null = null;
					let margin: number | null = null;

					if (salesPrice !== null && costPrice !== null) {
						const targetCurrency = this.model.get('salesPriceCurrency') as string;
						let costForCalc = costPrice;
						if (targetCurrency && costPriceCurrency && targetCurrency !== costPriceCurrency) {
							const converted = this.convertFromCurrency(costPrice, costPriceCurrency, targetCurrency);
							costForCalc = converted !== null ? converted : costForCalc;
						}

						if (salesPrice === 0 && costForCalc === 0) {
							markup = 0;
							margin = 0;
						} else {
							if (costForCalc !== 0) {
								markup = ((salesPrice - costForCalc) / costForCalc) * 100;
							}
							if (salesPrice !== 0) {
								margin = ((salesPrice - costForCalc) / salesPrice) * 100;
							}
						}
					}

					this.model.set({
						priceMarkup: this.round(markup),
						priceMargin: this.round(margin),
					}, { silentToDynamicHandler: true });
					break;
				}
				case 'Markup over Cost': {
					let markup = this.model.get('priceMarkup') as number | null;
					let salesPrice: number | null = null;
					let margin: number | null = null;
					const targetCurrency = (this.model.get('salesPriceCurrency') as string) || costPriceCurrency;

					if (markup !== null && costPrice !== null) {
						let costForCalc = costPrice;
						if (targetCurrency && costPriceCurrency && targetCurrency !== costPriceCurrency) {
							const converted = this.convertFromCurrency(costPrice, costPriceCurrency, targetCurrency);
							costForCalc = converted !== null ? converted : costForCalc;
						}
						markup /= 100;
						salesPrice = (1 + markup) * costForCalc;
						margin = (markup / (1 + markup)) * 100;
					}

					this.model.set({
						salesPrice: this.round(salesPrice),
						salesPriceCurrency: targetCurrency,
						priceMargin: this.round(margin),
					}, { silentToDynamicHandler: true });
					break;
				}
				case 'Profit Margin': {
					let margin = this.model.get('priceMargin') as number | null;
					let salesPrice: number | null = null;
					let markup: number | null = null;
					const targetCurrency = (this.model.get('salesPriceCurrency') as string) || costPriceCurrency;

					if (margin !== null && costPrice !== null) {
						let costForCalc = costPrice;
						if (targetCurrency && costPriceCurrency && targetCurrency !== costPriceCurrency) {
							const converted = this.convertFromCurrency(costPrice, costPriceCurrency, targetCurrency);
							costForCalc = converted !== null ? converted : costForCalc;
						}
						margin /= 100;
						salesPrice = costForCalc / (1 - margin);
						markup = (margin / (1 - margin)) * 100;
					}

					this.model.set({
						salesPrice: this.round(salesPrice),
						salesPriceCurrency: targetCurrency,
						priceMarkup: this.round(markup),
					}, { silentToDynamicHandler: true });
					break;
				}
				case 'Same as Cost Price': {
					const targetCurrency = (this.model.get('salesPriceCurrency') as string) || costPriceCurrency;
					let newSalesPrice = costPrice;
					if (targetCurrency && costPriceCurrency && targetCurrency !== costPriceCurrency) {
						const converted = this.convertFromCurrency(costPrice, costPriceCurrency, targetCurrency);
						newSalesPrice = converted !== null ? converted : newSalesPrice;
					}
					this.model.set({
						salesPrice: this.round(newSalesPrice),
						salesPriceCurrency: targetCurrency,
						priceMarkup: null,
						priceMargin: null,
					}, { silentToDynamicHandler: true });
					break;
				}
				case 'Purchasing Coefficient': {
					const salesPrice = this.convertFromCurrency(
						this.model.get('salesPrice') as number,
						this.model.get('salesPriceCurrency') as string,
						this.model.get('costPriceCurrency') as string,
					);
					const coefficient = this.model.get('coefficient') as number | null;

					const newCostPrice = coefficient !== null ? salesPrice! * coefficient : null;

					this.model.set({
						costPrice: this.round(newCostPrice),
						priceMargin: null,
						priceMarkup: null,
					}, { silentToDynamicHandler: true });
					break;
				}
				case 'Sales Coefficient': {
					const costPriceConverted = this.convertFromCurrency(
						this.model.get('costPrice') as number,
						this.model.get('costPriceCurrency') as string,
						this.model.get('salesPriceCurrency') as string,
					);

					const coefficient = this.model.get('coefficient') as number | null;

					const newSalesPrice = coefficient !== null ? costPriceConverted! * coefficient : null;

					this.model.set({
						salesPrice: this.round(newSalesPrice),
						priceMargin: null,
						priceMarkup: null,
					}, { silentToDynamicHandler: true });
					break;
				}
				default: {
					this.model.set({
						salesPrice: null,
						salesPriceWithTax: null,
						priceMarkup: null,
						priceMargin: null,
					}, { silentToDynamicHandler: true });
					break;
				}
			}

			this.isCalculatingPrice = false;
		}

		convertFromCurrency(value: number | null, fromCurrency: string | null, toCurrency: string | null): number | null {
			try {
				const baseCurrency = this.recordView
					.getConfig()
					.get('baseCurrency') as string;

				if (!fromCurrency) {
					fromCurrency = baseCurrency;
				}
				if (!toCurrency) {
					toCurrency = baseCurrency;
				}

				if (fromCurrency === toCurrency) {
					return value;
				}

				const productCurrencyRates = this.recordView
					.getConfig()
					.get('productCurrencyRates') as Record<string, number> | undefined;

				if (productCurrencyRates) {
					const toCZK = (val: number, currency: string): number => {
						if (currency === baseCurrency) return val;
						const rate = productCurrencyRates[currency];
						if (!rate) {
							throw new Error(`Unsupported currency: ${currency}`);
						}
						return val * rate;
					};

					const fromCZK = (val: number, currency: string): number => {
						if (currency === baseCurrency) return val;
						const rate = productCurrencyRates[currency];
						if (!rate) {
							throw new Error(`Unsupported currency: ${currency}`);
						}
						return val / rate;
					};

					const valueInCZK = toCZK(value!, fromCurrency);
					const convertedValue = fromCZK(valueInCZK, toCurrency);

					return convertedValue;
				}

				const currencyRates = this.recordView
					.getConfig()
					.get('currencyRates') as Record<string, number> | undefined;

				if (currencyRates) {
					const toBase = (val: number, currency: string): number => {
						if (currency === baseCurrency) return val;
						const rate = currencyRates[currency];
						if (!rate) {
							throw new Error(`Unsupported currency: ${currency}`);
						}
						return val * rate;
					};

					const fromBase = (val: number, currency: string): number => {
						if (currency === baseCurrency) return val;
						const rate = currencyRates[currency];
						if (!rate) {
							throw new Error(`Unsupported currency: ${currency}`);
						}
						return val / rate;
					};

					const valueInBase = toBase(value!, fromCurrency);
					const convertedValue = fromBase(valueInBase, toCurrency);

					return convertedValue;
				}

				throw new Error('No currency rates available');
			} catch (error) {
				console.error('Error in convertFromCurrency:', (error as Error).message);
				return null;
			}
		}
	},
);
