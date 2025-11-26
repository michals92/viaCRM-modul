import type CurrencyListFieldView from 'espocrm/src/views/fields/currency-list';

define(
	['views/fields/currency-list'],
	(Dep: typeof CurrencyListFieldView) => class extends Dep {
		override type = 'currencyCode';
	},
);
