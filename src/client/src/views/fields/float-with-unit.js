define(['views/fields/float', 'ui/select'], (Dep, Select) => class extends Dep {
	detailTemplate = 'autocrm:fields/float-with-unit/detail';
	editTemplate = 'autocrm:fields/float-with-unit/edit';
	listTemplate = 'autocrm:fields/float-with-unit/list';

	setup() {
		super.setup();

		this.defaultUnit = this.getUnitFieldOptions()[0];
	}

	data() {
		const unitFieldName = this.getUnitFieldName();

		if (!this.model.get(unitFieldName) && this.getUnitFieldOptions()) {
			this.model.set(unitFieldName, this.defaultUnit, {silent: true});
		}

		const unitValue = this.getUnitFieldValue();
		const unitList = this.getUnitFieldOptions();

		const data = super.data();

		data.params.compact = this.model.getFieldParam(this.name, 'compact');

		return {
			...data,
			unitList,
			unitValue,
			unitFieldName,
		};
	}

	fetch() {
		const unitValue = this.$unit.length ? this.$unit.val() : this.defaultUnit;

		return {
			...super.fetch(),
			[this.name + 'Unit']: unitValue,
		};
	}

	afterRender() {
		super.afterRender();

		if (this.isEditMode()) {
			const selector = this.$el.find(`[data-name="${this.getUnitFieldName()}"]`);
			this.$unit = this.$el.find(selector);

			if (this.$unit.length) {
				// Translate options in select dropdown
				this.$unit.find('option').each((_i, option) => {
					const $option = $(option);
					const value = $option.val();
					const translatedLabel = this.getTranslatedUnitLabel(value);
					$option.text(translatedLabel);
				});

				this.$unit.on('change', () => {
					this.model.set(this.getUnitFieldName(), this.$unit.val(), {ui: true});
				});

				// Initialize Select on focus or click instead of immediately
				const $selectorElement = this.$el.find(selector);

				// Option 1: Initialize on focus
				$selectorElement.on('mouseenter', function (_e) {
					if (!$(this).data('select-initialized')) {
						Select.init($(this));
						$(this).data('select-initialized', true);
					}
				});
			}
		} else {
			// In detail or list mode, translate the unit label
			if (this.$el.find('.unit-value').length) {
				const unitValue = this.getUnitFieldValue();
				if (unitValue) {
					const translatedValue = this.getTranslatedUnitLabel(unitValue);
					this.$el.find('.unit-value').text(translatedValue);
				}
			}
		}
	}

	getUnitFieldValue() {
		return this.model.get(this.getUnitFieldName());
	}

	getUnitFieldName() {
		return this.name + 'Unit';
	}

	getUnitFieldOptions() {
		return this.model.defs.fields[this.name].units || [];
	}

	/**
	 * Helper function to translate unit values with fallback to Globals
	 * @param {string} unitValue - The unit value to translate
	 * @returns {string} - The translated unit value
	 */
	getTranslatedUnitLabel(unitValue) {
		if (!unitValue) return unitValue;

		let translatedValue = this.translate(unitValue, 'units', this.model.entityType);

		if (!translatedValue || translatedValue === unitValue) {
			translatedValue = this.translate(unitValue, 'units', 'Global');
		}

		return translatedValue;
	}
});