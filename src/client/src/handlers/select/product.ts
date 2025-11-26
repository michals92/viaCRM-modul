import type Model from 'espocrm/src/model';

interface SelectHandlerView {
	model: Model;
}

interface ProductAttributes {
	listPrice?: number;
	unitPrice?: number;
	costPrice?: number;
	name?: string;
	productId?: string;
	[key: string]: unknown;
}

define(
	[],
	() => class ProductSelectHandler {
		view: SelectHandlerView;

		constructor(view: SelectHandlerView) {
			this.view = view;
		}

		getClearAttributes(): ProductAttributes {
			return {
				listPrice: null,
				unitPrice: null,
				costPrice: null,
			};
		}

		getAttributes(model: Model): ProductAttributes {
			return {
				listPrice: model.get('listPrice') as number,
				unitPrice: model.get('unitPrice') as number,
				costPrice: model.get('costPrice') as number,
			};
		}
	},
);
