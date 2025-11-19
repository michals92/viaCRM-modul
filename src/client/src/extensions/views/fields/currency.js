extend(Dep => class extends Dep {
	editTemplate = 'autocrm:fields/currency/edit';

	setup() {
		super.setup();

		this.decimalPlaces = this.params.decimalPlaces ?? this.getConfig().get('currencyDecimalPlaces');
	}
});
