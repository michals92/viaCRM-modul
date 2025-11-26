import type { UiSelectModule } from '../../../@types/ui-modules';

import type AddressCountryFieldView from 'espocrm/src/views/fields/address-country';

type AddressCountryFieldData = {
	countryValue?: string;
	isEnum?: boolean;
	options?: string[];
	translatedOptions?: Record<string, string>;
	styleMap?: Record<string, string>;
	[key: string]: unknown;
};

extend<AddressCountryFieldView>(['ui/select'], (Dep, Select: UiSelectModule) => class extends Dep {
	isEnum: boolean = false;

	override editTemplate = 'viacrm:fields/address-country/edit';

	override init(): void {
		super.init();

		this.isEnum = this.getConfig().get('addressCountryAsEnum') ?? false;
	}

	override setupOptions(): void {
		if (!this.isEnum) {
			super.setupOptions();
		} else {
			const countryList = this.getConfig().get('addressCountryList') || [];

			if (countryList.length) {
				this.params.options = Espo.Utils.clone(countryList);
			}
		}
	}

	override data(): AddressCountryFieldData {
		const data: AddressCountryFieldData = super.data();

		if (!this.isEnum) {
			return data;
		} else {
			const countryOptions = Espo.Utils.clone(this.getConfig().get('addressCountryList') || []) as string[];

			countryOptions.push('');

			const countryValue = data.countryValue;

			const styleMap: Record<string, string> = {};

			if (countryValue && !countryOptions.includes(countryValue)) {
				styleMap[countryValue] = 'danger';
			}

			return {
				...data,
				isEnum: true,
				options: this.getConfig().get('addressCountryList') || [],
				translatedOptions: this.getLanguage().get('Global', 'options', 'addressCountryList') || {},
				styleMap,
			};
		}
	}

	override afterRender(): void {
		super.afterRender();

		if (this.isEnum && this.isEditMode()) {
			if (this.$el) {
				Select.init(this.$element, { matchAnyWord: true });
			}
		}
	}

	override getValueForDisplay(): string {
		const val: string = super.getValueForDisplay();

		if (!this.isEnum) {
			return val;
		}

		return this.getLanguage().translateOption(val, 'addressCountryList', 'Global');
	}
});
