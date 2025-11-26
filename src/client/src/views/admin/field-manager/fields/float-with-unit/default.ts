define(['autocrm:views/fields/float-with-unit'], Dep => class extends Dep {
	data() {
		const data = super.data();

		const defaultAttributes = this.model.get('defaultAttributes') || {};

		const value = defaultAttributes[this.options.field];

		if (value !== null && typeof value !== 'undefined') {
			data.isNotEmpty = true;
		}

		data.valueIsSet = !!value;

		if (this.isEditMode()) {
			data.value = value;
		}

		return data;
	}

	setup() {
		super.setup();

		this.listenTo(this.model, 'change:units', () => this.reRender());
	}

	getUnitFieldValue() {
		const defaultAttributes = this.model.get('defaultAttributes') || {};

		return defaultAttributes[this.options.field + 'Unit'];
	}

	getUnitFieldName() {
		return this.options.field + 'Unit';
	}

	getUnitFieldOptions() {
		return this.model.get('units') || [];
	}

	validateFloat() {
		const defaultAttributes = this.model.get('defaultAttributes') || {};

		const value = defaultAttributes[this.options.field];

		if (isNaN(value)) {
			const msg = this.translate('fieldShouldBeFloat', 'messages').replace('{field}', this.getLabelText());

			this.showValidationMessage(msg);

			return true;
		}
	}

	getValueForDisplay() {
		const defaultAttributes = this.model.get('defaultAttributes') || {};

		const value = isNaN(defaultAttributes[this.options.field]) ? null : defaultAttributes[this.options.field];

		return this.formatNumber(value);
	}

	fetch() {
		const data = super.fetch();

		const defaultAttributes = {};

		defaultAttributes[this.options.field] = data[this.name];
		defaultAttributes[this.options.field + 'Unit'] = data[this.name + 'Unit'];

		return {
			defaultAttributes,
		};
	}
});
