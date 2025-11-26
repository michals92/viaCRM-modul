import type CurrencyFieldView from 'espocrm/src/views/fields/currency';

extend<CurrencyFieldView>(Dep => class extends Dep {
	override editTemplate = 'viacrm:fields/currency/edit';

	override setup(): void {
		super.setup();

		this.decimalPlaces = this.params.decimalPlaces ?? this.getConfig().get('currencyDecimalPlaces');
	}
});
