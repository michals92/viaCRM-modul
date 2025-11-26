import type LinkMultipleFieldView from 'espocrm/src/views/fields/link-multiple';

define(
	['views/fields/link-multiple'],
	(Dep: typeof LinkMultipleFieldView) => class extends Dep {
		// Non-storable linkMultiple field for Product suppliers
		// Data is managed via the suppliers hasMany link (productAccount relation)

		override setup(): void {
			super.setup();

			// Non-storable fields should be read-only in edit mode
			if (this.isEditMode()) {
				this.setReadOnly(true);
			}
		}
	},
);
