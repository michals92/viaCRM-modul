import type EnumFieldView from 'espocrm/src/views/fields/enum';

define(
	'viacrm:views/fields/measure-unit',
	['views/fields/enum'],
	(Dep: typeof EnumFieldView) => class extends Dep {
		declare params: { required?: boolean; options?: string[] };

		override setup(): void {
			let options = (this.getConfig().get('quantityUnitList') as string[]) || [];

			if (!options.length) {
				options = ['ks', 'bal', 'set', 'kpl', 'm', 'm2', 'kg', 'l'];
			}

			if (!this.params.required && !options.includes('')) {
				options = ['', ...options];
			}

			this.params.options = options;

			super.setup();
		}
	},
);
