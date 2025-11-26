import type BaseFieldView from 'espocrm/src/views/fields/base';
import type Model from 'espocrm/src/model';
import type { DynamicChecklistFieldData } from 'viacrm/types';

interface ChecklistItem {
	checked: boolean;
	label: string;
}

declare const _: {
	isUndefined(value: unknown): boolean;
};

define(
	['views/fields/base'],
	(Dep: typeof BaseFieldView) => class extends Dep {
		override type = 'dynamic-checklist';

		override listTemplate = 'viacrm:fields/dynamic-checklist/list';
		override detailTemplate = 'viacrm:fields/dynamic-checklist/detail';
		override editTemplate = 'viacrm:fields/dynamic-checklist/edit';
		override searchTemplate = 'viacrm:fields/dynamic-checklist/search';

		searchTypeList = ['anyOf', 'noneOf', 'allOf', 'isEmpty', 'isNotEmpty'];

		MAX_ITEM_LENGTH = 100;

		maxItemLength: number | null = null;

		override validations = ['required', 'maxCount'];

		selected: ChecklistItem[] = [];

		$list!: JQuery;
		$addButton!: JQuery;
		$addItemInput!: JQuery;
		declare model: Model;
		declare name: string;
		declare params: { maxCount?: number; hideUncheckedInView?: boolean };

		override events: Record<string, (e: JQuery.ClickEvent) => void> = {
			'click [data-action="removeValue"]': (e: JQuery.ClickEvent) => {
				const index = $(e.currentTarget).closest('.list-group-item').data('row-id') as number;
				this.removeItem(index);
			},
		};

		override data(): DynamicChecklistFieldData {
			const itemHtmlList: string[] = [];

			(this.selected || []).forEach((item, index) => {
				itemHtmlList.push(this.getItemHtml(item, index));
			}, this);

			return Object.assign(
				{
					selected: this.selected,
					itemHtmlList: itemHtmlList,
					isEmpty: (this.selected || []).length === 0,
					valueIsSet: this.model.has(this.name),
					maxItemLength: this.maxItemLength || this.MAX_ITEM_LENGTH,
				},
				super.data(),
			);
		}

		override setup(): void {
			super.setup();

			this.fetchFromModel();

			this.listenTo(this.model, 'change:' + this.name, this.fetchFromModel, this);
		}

		fetchFromModel(): void {
			this.selected = Espo.Utils.clone(this.model.get(this.name) as ChecklistItem[]) || [];
		}

		override fetch(): Record<string, ChecklistItem[]> {
			this.fetchFromDom();
			return {
				[this.name]: this.selected,
			};
		}

		override validateRequired(): boolean {
			if (this.isRequired()) {
				const value = this.model.get(this.name) as ChecklistItem[] | null;

				if (!value || value.length === 0) {
					const msg = (this.translate('fieldIsRequired', 'messages') as string).replace('{field}', this.getLabelText());

					this.showValidationMessage(msg, '.array-control-container');

					return true;
				}
			}

			return false;
		}

		validateMaxCount(): boolean {
			if (this.params.maxCount) {
				const itemList = (this.model.get(this.name) as ChecklistItem[]) || [];

				if (itemList.length > this.params.maxCount) {
					const msg = (this.translate('fieldExceedsMaxCount', 'messages') as string)
						.replace('{field}', this.getLabelText())
						.replace('{maxCount}', this.params.maxCount.toString());

					this.showValidationMessage(msg, '.array-control-container');

					return true;
				}
			}

			return false;
		}

		getItemHtml(item: ChecklistItem, index?: number): string {
			index = _.isUndefined(index) ? this.selected.length - 1 : index;

			return $('<div>')
				.addClass('list-group-item')
				.attr('data-row-id', index)
				.append('&nbsp;')
				.append(
					$('<input>').attr('type', 'checkbox').addClass('form-checkbox').attr('checked', item.checked),

					$('<input>')
						.attr('type', 'text')
						.attr('value', item.label)
						.addClass('main-element')
						.addClass('form-control'),

					$('<div>')
						.addClass('action-items')
						.append(
							$('<a>')
								.addClass('pull-right')
								.attr('data-action', 'removeValue')
								.append($('<span>').addClass('fas fa-trash-alt')),
						),
				)
				.get(0)!.outerHTML;
		}

		addValue(label: string): void {
			const item: ChecklistItem = {
				checked: false,
				label: label,
			};

			this.selected.push(item);

			const html = this.getItemHtml(item);
			this.$list.append(html);

			this.trigger('change');
		}

		removeItem(index: number): void {
			this.$list.children(`[data-row-id=${index}]`).remove();

			this.selected.splice(index, 1);

			this.trigger('change');
		}

		override getValueForDisplay(): string {
			let itemsToShow = this.selected;

			if (this.params.hideUncheckedInView && !this.isEditMode() && !this.isSearchMode()) {
				itemsToShow = this.selected.filter(item => item.checked);
			}

			return $('<div>')
				.addClass('dynamic-checklist-field')
				.append(
					itemsToShow.map(item => $('<div>').append(
						$('<input>')
							.attr('type', 'checkbox')
							.addClass('form-checkbox')
							.attr('disabled', true)
							.attr('checked', item.checked),

						$('<span>').text(item.label),
					)),
				)
				.get(0)!.outerHTML;
		}

		fetchFromDom(): void {
			const selected: ChecklistItem[] = [];
			this.$el.find('.list-group .list-group-item').each((_i: number, el: HTMLElement) => {
				selected.push({
					checked: $(el).find('input:checkbox').is(':checked'),
					label: $(el).find('input:text').val() as string,
				});
			});

			this.selected = selected;
		}

		controlAddItemButton(): void {
			if (this.params.maxCount && this.selected.length >= this.params.maxCount) {
				this.$addButton.addClass('disabled');
			}
		}

		override afterRender(): void {
			if (this.mode === 'edit') {
				this.$list = this.$el.find('.list-group');

				const $addItemInput = (this.$addItemInput = this.$el.find('input.addItem'));

				this.$addButton = this.$el.find('button[data-action="addItem"]');

				this.$addButton.on('click', () => {
					const label = this.$addItemInput.val()!.toString();
					this.addValue(label);
					$addItemInput.val('');
				});

				$addItemInput.on('input', () => {
					this.controlAddItemButton();
				});

				$addItemInput.on('keypress', (e: JQuery.KeyPressEvent) => {
					if (e.keyCode === 13 || e.keyCode === 9) {
						const label = $addItemInput.val()!.toString();
						this.addValue(label);
						$addItemInput.val('');
						this.controlAddItemButton();
					}
				});

				this.controlAddItemButton();

				(this.$list as JQuery & { sortable(options: Record<string, unknown>): void }).sortable({
					stop: () => {
						this.fetchFromDom();
						this.trigger('change');
					},
				});
			}

			if (this.mode === 'search') {
				this.renderSearch();
			}

			this.$el.find('input:checkbox').on('change', () => {
				this.fetchFromDom();
				this.trigger('change');
			});
		}
	},
);
