import type CurrencyFieldView from 'espocrm/src/views/fields/currency';

define(
	['views/fields/currency'],
	(Dep: typeof CurrencyFieldView) => class extends Dep {
		override editTemplate = 'viacrm:fields/currency-amount-only/edit';
	},
);
