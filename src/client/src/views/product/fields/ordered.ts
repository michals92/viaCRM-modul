import type BoolFieldView from 'espocrm/src/views/fields/bool';

define(
	['views/fields/bool'],
	(Dep: typeof BoolFieldView) => class extends Dep {
		// Non-storable bool field indicating if the product has any PurchaseOrderItems
		// Value is loaded via OrderedLoader.php on the backend

		override setup(): void {
			super.setup();

			// Non-storable field - always read-only
			this.readOnly = true;
		}
	},
);
