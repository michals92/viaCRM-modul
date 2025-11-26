import type IntFieldView from 'espocrm/src/views/fields/int';
import type {Select as SelectType} from 'ui/select';
import type Model from 'espocrm/src/model';
import type { IntWithUnitFieldData } from 'viacrm/types';

define(
	['views/fields/int', 'ui/select'],
	(Dep: typeof IntFieldView, Select: typeof SelectType) => class extends Dep {
		override detailTemplate = 'viacrm:fields/int-with-unit/detail';
		override editTemplate = 'viacrm:fields/int-with-unit/edit';
		override listTemplate = 'viacrm:fields/int-with-unit/list';
		defaultUnit!: string;
		$unit!: JQuery;
		declare name: string;
		declare model: Model & { defs: { fields: Record<string, { units?: string[] }> }; getFieldParam(name: string, param: string): unknown };

		override setup(): void {
			super.setup();

			this.defaultUnit = this.getUnitFieldOptions()[0];
		}

		override data(): IntWithUnitFieldData {
			const unitFieldName = this.getUnitFieldName();

			if (!this.model.get(unitFieldName) && this.getUnitFieldOptions()) {
				this.model.set(unitFieldName, this.defaultUnit);
			}

			const unitValue = this.getUnitFieldValue();
			const unitList = this.getUnitFieldOptions();

			const data = super.data() as { params: Record<string, unknown> };

			data.params.compact = this.model.getFieldParam(this.name, 'compact');

			return {
				...data,
				unitList,
				unitValue,
				unitFieldName,
			};
		}

		override fetch(): Record<string, unknown> {
			const unitValue = this.$unit.length ? this.$unit.val() : this.defaultUnit;

			return {
				...super.fetch(),
				[this.name + 'Unit']: unitValue,
			};
		}

		override afterRender(): void {
			super.afterRender();

			if (this.isEditMode()) {
				const selector = this.$el.find(`[data-name="${this.getUnitFieldName()}"]`);

				this.$unit = this.$el.find(selector);

				if (this.$unit.length) {
					// Translate options in select dropdown
					this.$unit.find('option').each((_i: number, option: HTMLElement) => {
						const $option = $(option);
						const value = $option.val() as string;
						const translatedLabel = this.getTranslatedUnitValue(value);
						$option.text(translatedLabel);
					});

					this.$unit.on('change', () => {
						this.model.set(this.getUnitFieldName(), this.$unit.val(), { ui: true });
					});

					Select.init(this.$el.find(selector));
				}
			} else {
				// In detail or list mode, translate the unit label
				if (this.$el.find('.unit-value').length) {
					const unitValue = this.getUnitFieldValue();
					if (unitValue) {
						const translatedValue = this.getTranslatedUnitValue(unitValue);
						this.$el.find('.unit-value').text(translatedValue);
					}
				}
			}
		}

		getUnitFieldValue(): string {
			return this.model.get(this.getUnitFieldName()) as string;
		}

		getUnitFieldName(): string {
			return this.name + 'Unit';
		}

		getUnitFieldOptions(): string[] {
			return this.model.defs.fields[this.name].units || [];
		}

		/**
		 * Helper function to translate unit values with fallback to Globals
		 * @param {string} unitValue - The unit value to translate
		 * @returns {string} - The translated unit value
		 */
		getTranslatedUnitValue(unitValue: string): string {
			if (!unitValue) return unitValue;

			// Try to get entity-specific translation
			let translatedValue = this.translate(unitValue, 'units', this.model.entityType) as string;

			// If we get back the same value, it means no translation was found
			// So we try with Globals scope as fallback
			if (translatedValue === unitValue) {
				translatedValue = this.translate(unitValue, 'units', 'Global') as string;
			}

			return translatedValue;
		}
	},
);
