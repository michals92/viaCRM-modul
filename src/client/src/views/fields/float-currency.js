define(['views/fields/float'], Dep => class extends Dep {
	type = 'floatCurrency';

	editTemplate = 'autocrm:fields/float-currency/edit';

	detailTemplate = 'fields/currency/detail';
	detailTemplate1 = 'fields/currency/detail-1';
	detailTemplate2 = 'fields/currency/detail-2';
	detailTemplate3 = 'fields/currency/detail-3';

	listTemplate = 'fields/currency/list';
	listTemplate1 = 'fields/currency/list-1';
	listTemplate2 = 'fields/currency/list-2';
	listTemplate3 = 'fields/currency/list-3';

	detailTemplateNoCurrency = 'fields/currency/detail-no-currency';

	maxDecimalPlaces = 3;

	setup() {
		super.setup();

		this.currencyFieldName = this.name + 'Currency';

		this.defaultCurrency = this.getConfig().get('defaultCurrency');
		this.decimalPlaces = this.getConfig().get('currencyDecimalPlaces');

		if (this.params.decimalPlaces !== null && this.params.decimalPlaces !== undefined) {
			this.decimalPlaces = this.params.decimalPlaces;
		}

		const currencyField = this.params.currencyField;
		const parentLinkName = this.params.parentLinkName;

		if (currencyField && parentLinkName) {
			const parentModel = this.model.collection?.parentModel;

			if (parentModel) {
				this.listenTo(parentModel, 'change:' + currencyField, () => {
					const currencyValue = parentModel.get(currencyField);

					this.model.set(this.currencyFieldName, currencyValue);
				});				
			}
		} else if (currencyField) {
			this.listenTo(this.model, 'change:' + currencyField, () => {
				const currencyValue = this.model.get(currencyField);

				this.model.set(this.currencyFieldName, currencyValue);
			});
		}

		this.listenTo(this.model, 'change:' + this.currencyFieldName, (_model, _value, o) => {
			if (Object.keys(o).length && !o.ui) {
				return;
			}

			this.reRender();
		});
	}

	data() {
		const baseData = super.data();
		const currencyValue = this.getCurrency() || this.defaultCurrency;

		return {
			...baseData,
			currencyValue: currencyValue,
			currencySymbol: this.getMetadata().get(['app', 'currency', 'symbolMap', currencyValue]) || '',
			currencyFieldName: this.currencyFieldName,
			currency: currencyValue,
		};
	}

	getCurrency() {
		return this.model.get(this.currencyFieldName) || this.defaultCurrency;
	}

	getCurrencyFormat() {
		return this.getConfig().get('currencyFormat') || 1;
	}

	_getTemplateName() {
		if (this.mode === this.MODE_DETAIL || this.mode === this.MODE_LIST) {
			let prop;

			if (this.mode === this.MODE_LIST) {
				prop = 'listTemplate' + this.getCurrencyFormat().toString();
			}
			else {
				prop = 'detailTemplate' + this.getCurrencyFormat().toString();
			}

			if (this.options.hideCurrency) {
				prop = 'detailTemplateNoCurrency';
			}

			if (prop in this) {
				return this[prop];
			}
		}

		return super._getTemplateName();
	}

	formatNumber(value) {
		return this.formatNumberDetail(value);
	}

	formatNumberDetail(value) {
		if (value !== null) {
			const currencyDecimalPlaces = this.decimalPlaces;

			if (currencyDecimalPlaces === 0) {
				value = Math.round(value);
			}
			else if (currencyDecimalPlaces) {
				value = Math.round(
					value * Math.pow(10, currencyDecimalPlaces)) / (Math.pow(10, currencyDecimalPlaces)
				);
			}
			else {
				value = Math.round(
					value * Math.pow(10, this.maxDecimalPlaces)) / (Math.pow(10, this.maxDecimalPlaces)
				);
			}

			const parts = value.toString().split(".");

			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandSeparator);

			if (currencyDecimalPlaces === 0) {
				return parts[0];
			}
			else if (currencyDecimalPlaces) {
				let decimalPartLength = 0;

				if (parts.length > 1) {
					decimalPartLength = parts[1].length;
				} else {
					parts[1] = '';
				}

				if (currencyDecimalPlaces && decimalPartLength < currencyDecimalPlaces) {
					const limit = currencyDecimalPlaces - decimalPartLength;

					for (let i = 0; i < limit; i++) {
						parts[1] += '0';
					}
				}
			}

			return parts.join(this.decimalMark);
		}

		return '';
	}

	setupAutoNumericOptions() {
		this.autoNumericOptions = {
			digitGroupSeparator: this.thousandSeparator || '',
			decimalCharacter: this.decimalMark,
			modifyValueOnWheel: false,
			selectOnFocus: false,
			decimalPlaces: this.decimalPlaces,
			allowDecimalPadding: true,
			showWarnings: false
		};

		if (this.decimalPlaces === null) {
			this.autoNumericOptions.decimalPlaces = this.decimalPlacesRawValue;
			this.autoNumericOptions.decimalPlacesRawValue = this.decimalPlacesRawValue;
			this.autoNumericOptions.allowDecimalPadding = false;
		}
	}
});
