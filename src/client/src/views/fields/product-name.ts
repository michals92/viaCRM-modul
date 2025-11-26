import type VarcharFieldView from 'espocrm/src/views/fields/varchar';
import type Model from 'espocrm/src/model';
import type { ProductNameFieldData } from 'viacrm/types';

type Autocomplete = any;

interface SelectRecordsModal {
	render(): void;
	close(): void;
}

interface ProductModel extends Model {
	get(name: 'id'): string;
	get(name: 'name'): string;
	get(name: 'salesPrice'): number;
	get(name: 'salesPriceCurrency'): string;
	get(name: string): unknown;
}

define(
	['views/fields/varchar', 'ui/autocomplete'],
	(Dep: typeof VarcharFieldView, Autocomplete: typeof AutocompleteType) => class extends Dep {
		override detailTemplate = 'viacrm:fields/product-name/detail';
		override listTemplate = 'viacrm:fields/product-name/detail';
		override editTemplate = 'viacrm:fields/product-name/edit';

		declare createButton: boolean;
		declare name: string;
		declare model: Model & { defs: { fields: Record<string, { compact?: boolean }> } };
		declare $element: JQuery;
		declare events: Record<string, () => void>;

		productFieldMapping: Record<string, string> = {
			name: 'name',
			productId: 'id',
			productName: 'name',
			unitPrice: 'salesPrice',
			unitPriceCurrency: 'salesPriceCurrency',
		};

		override data(): ProductNameFieldData {
			const data = super.data() as ProductNameFieldData;
			const isProduct = !!this.model.get('productId');

			data.params = (data.params || {}) as Record<string, unknown>;
			(data.params as Record<string, unknown>).compact = this.model.defs.fields[this.name].compact;
			data.isProduct = isProduct;
			data.isNotProduct = !isProduct && !!this.model.get('name');
			data.productId = this.model.get('productId');

			return data;
		}

		override setup(): void {
			super.setup();

			this.on('change', this.handleSelectProductVisibility, this);

			this.setupEvents();
		}

		setupEvents(): void {
			this.events['click [data-action="selectProduct"]'] = async () => {
				Espo.Ui.notifyWait();

				const viewName =
					(this.getMetadata().get(['clientDefs', 'Product', 'modalViews', 'select']) as string) ||
					'views/modals/select-category-tree-records';

				const view = await this.createView('dialog', viewName, {
					scope: 'Product',
					createButton: this.createButton,
					forceSelectAllAttributes: true,
				}) as SelectRecordsModal;

				view.render();
				Espo.Ui.notify(false);

				this.listenToOnce(view, 'select', (model: ProductModel) => {
					view.close();
					this.selectProduct(model);
				});
			};
		}

		handleSelectProductVisibility(): void {
			if (!this.model.get('productId') && this.model.get('name')) {
				this.$el.find('[data-action="selectProduct"]').addClass('disabled').attr('disabled', 'disabled');
			} else {
				this.$el.find('[data-action="selectProduct"]').removeClass('disabled').removeAttr('disabled');
			}
		}

		override afterRender(): void {
			super.afterRender();

			this.handleSelectProductVisibility();

			if (this.isEditMode() || this.isSearchMode()) {
				this.setupAutocomplete();
			}
		}

		setupAutocomplete(): void {
			const autocomplete = new Autocomplete(this.$element.get(0) as HTMLInputElement, {
				name: this.name,
				minChars: 1,
				focusOnSelect: true,
				handleFocusMode: 2,
				autoSelectFirst: true,
				triggerSelectOnValidInput: false,
				forceHide: true,
				onSelect: (item: { attributes: Record<string, unknown> }) => {
					this.getModelFactory().create('Product', (model: ProductModel) => {
						model.set(item.attributes);

						this.selectProduct(model);
						this.$element.focus();
					});
				},
				lookupFunction: (query: string) => Espo.Ajax.getRequest(this.getAutocompleteUrl(), {
					q: query,
				}).then(
					(response: { list: Array<{ id: string; name?: string }> }) => response.list.map(item => ({
						id: item.id,
						name: item.name || item.id,
						data: item.id,
						value: item.name || item.id,
						attributes: item,
					})),
				),
			});

			this.once('render remove', () => autocomplete.dispose());
		}

		override getAutocompleteUrl(): string {
			return 'Product';
		}

		getSearchParamsForAutocomplete(_q: string): Record<string, unknown> {
			return {
				maxSize: this.getConfig().get('recordsPerPage'),
				where: [
					{
						type: 'textFilter',
						value: _q,
					},
				],
			};
		}

		selectProduct(model: ProductModel): void {
			const setData: Record<string, unknown> = {};

			const allowedAttributes = new Set(this.getFieldManager().getEntityTypeAttributeList(this.model.name));

			if (this.getConfig().get('doNotCopyProductTaxRate')) {
				delete this.productFieldMapping.taxRate;
			}

			for (const [invoiceField, productField] of Object.entries(this.productFieldMapping)) {
				const value = model.get(productField);

				if (value && allowedAttributes.has(invoiceField)) {
					setData[invoiceField] = value;
				}
			}

			this.model.set(setData);

			this.handleSelectProductVisibility();
			this.$element.prop('readonly', true);

			this.trigger('change');
		}
	},
);
