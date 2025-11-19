extend(['ui/select'], (Dep, Select) => class extends Dep {
	isEnum = false;

	editTemplate = 'autocrm:fields/address-country/edit';

	init() {
		super.init();

		this.isEnum = this.getConfig().get('addressCountryAsEnum') ?? false;
	}

	setupOptions() {
		if (!this.isEnum) {
			super.setupOptions();
		} else {
			let countryList = this.getConfig().get('addressCountryList') || [];

			if (countryList.length) {
				this.params.options = Espo.Utils.clone(countryList);
			}
		}
	}

	data() {
		const data = super.data();

		if (!this.isEnum) {
			return data;
		} else {
			const countryOptions = Espo.Utils.clone(this.getConfig().get('addressCountryList') || []);

			countryOptions.push('');

			const countryValue = data.countryValue;

			const styleMap = {};

			if (!countryOptions.includes(countryValue)) {
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

	afterRender() {
		super.afterRender();

		if (this.isEnum && this.isEditMode()) {
			if (this.$el) {
				Select.init(this.$element, { matchAnyWord: true });
			}
		}
	}

	getValueForDisplay() {
		const val = super.getValueForDisplay();

		if (!this.isEnum) {
			return val;
		}

		return this.getLanguage().translateOption(val, 'addressCountryList', 'Global');
	}
});
