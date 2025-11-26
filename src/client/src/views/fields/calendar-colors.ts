import type ArrayFieldView from 'espocrm/src/views/fields/array';
import type Model from 'espocrm/src/model';
import type { CalendarColorsFieldData } from 'viacrm/types';

interface TranslatedEntity {
	name: string;
	label: string;
}

define(
	['views/fields/array'],
	(Dep: typeof ArrayFieldView) => class extends Dep {
		override editTemplate = 'viacrm:settings/fields/calendar-colors/edit';
		entityList!: string[];
		colorMap!: Record<string, string>;
		translatedEntityList!: TranslatedEntity[];
		$list!: JQuery;
		$select!: JQuery;
		$addButton!: JQuery;
		declare allowCustomOptions: boolean;
		declare name: string;
		declare model: Model;

		override setup(): void {
			super.setup();

			this.entityList = (this.getConfig().get('calendarEntityList') as string[]) || [];
			this.colorMap = (this.model.get(this.name) as Record<string, string>) || {};

			this.translatedEntityList = this.entityList.map((entityType: string) => ({
				name: entityType,
				label: this.translate(entityType, 'scopeNames') as string,
			}));

			this.wait(Espo.loader.requirePromise('lib!bootstrap-colorpicker'));
		}

		override data(): CalendarColorsFieldData {
			return {
				...super.data(),
				entityList: this.translatedEntityList,
				colorMap: this.colorMap,
			};
		}

		override afterRender(): void {
			if (this.isEditMode()) {
				this.$list = this.$el.find('.list-group');

				const $select = (this.$select = this.$el.find('.select'));

				if (this.allowCustomOptions) {
					this.$addButton = this.$el.find('button[data-action="addItem"]');

					this.$addButton.on('click', () => {
						const value = $select.val()!.toString();

						this.addValueFromUi(value);

						this.focusOnElement();
					});

					$select.on('input', () => this.controlAddItemButton());

					$select.on('keydown', (e: JQuery.KeyDownEvent) => {
						const key = Espo.Utils.getKeyFromKeyEvent(e);

						if (key === 'Enter') {
							const value = $select.val()!.toString();

							this.addValueFromUi(value);
						}
					});

					this.controlAddItemButton();
				}
			}

			if (this.isSearchMode()) {
				this.renderSearch();
			}

			if (this.isEditMode()) {
				$('.input-group').each((_: number, element: HTMLElement) => {
					const $element = $(element);
					const $input = $element.find('input[data-name="colorValue"]');

					($element as JQuery & { colorpicker: (options: unknown) => JQuery })
						.colorpicker({
							format: 'hex',
							container: $element.closest('.modal').length ? $element : false,
							component: '.input-group-addon',
							sliders: {
								saturation: {
									maxLeft: 200,
									maxTop: 200,
								},
								hue: {
									maxTop: 200,
								},
								alpha: {
									maxTop: 200,
								},
							},
						})
						.on('changeColor', () => {
							this.trigger('change');
						});

					$input.on('change', () => {
						if ($input.val() === '') {
							$element.find('.input-group-addon > i').css('background-color', 'transparent');
						}
						this.trigger('change');
					});
				});
			}
		}

		override fetch(): Record<string, Record<string, string>> {
			const data: Record<string, Record<string, string>> = {};
			data[this.name] = {};

			this.entityList.forEach((entityType: string) => {
				const colorValue = this.$el.find(`input[data-name="colorValue"][data-value="${entityType}"]`).val() as string;

				if (colorValue) {
					data[this.name][entityType] = colorValue;
				}
			});

			return data;
		}
	},
);
