import type LinkMultipleFieldView from 'espocrm/src/views/fields/link-multiple';
import type ColumnListClass from 'viacrm/views/fields/link-multiple/column-list';
import type RecordBaseView from 'espocrm/src/views/record/base';
import type Model from 'espocrm/src/model';
import type Collection from 'espocrm/src/collection';
import type { LinkMultipleFieldData } from 'viacrm/types';

interface RecordListView {
	validate(): boolean;
	fetch(): Record<string, unknown>[];
	isBeingRendered(): boolean;
	render(): void;
}

interface ModalView {
	render(): void;
	notify(show: boolean): void;
	getRecordView(): { model: Model };
	dialog: { close(): void };
	actionSave?(): void;
}

interface SelectDialogView {
	render(): void;
}

interface Defs {
	name: string;
	create?: boolean;
	select?: boolean;
}

define(
	['views/fields/link-multiple', 'viacrm:views/fields/link-multiple/column-list', 'views/record/base'],
	(
		Dep: typeof LinkMultipleFieldView,
		ColumnList: typeof ColumnListClass,
		RecordBase: typeof RecordBaseView,
	) => class extends Dep {
		override detailTemplate = 'viacrm:fields/link-multiple/detail';
		override listTemplate = 'viacrm:fields/link-multiple/list';
		override editTemplate = 'viacrm:fields/link-multiple/edit';

		recordListEnabled = false;

		columnListEnabled = false;
		columnList: InstanceType<typeof ColumnListClass> | false = false;

		enableShowDisplayList = false;

		recordListLayout = 'listSmall';

		recordListLayoutSuperCompact = 'listSmall';

		recordListView = 'viacrm:views/fields/link-multiple/record-list';

		seed: Model | null = null;

		collection: (Collection & {
			parentModel?: Model;
			url?: string;
			urlRoot?: string;
			orderBy?: string;
			defaultOrderBy?: string;
			order?: string;
			defaultOrder?: string;
			orderByDefaultOrder?(): void;
			resetOrderToDefault?(): void;
			trigger(event: string, ...args: unknown[]): void;
		}) | null = null;

		override validations = ['required', 'recordList'];

		plusIconClass = 'fas fa-plus';

		linkIconClass = 'fas fa-link';

		defaultSelectFilters: Record<string, unknown> = {};
		recordListCreateDisabled = false;
		recordListLinkDisabled = false;
		recordListRemoveDisabled = false;
		recordListDuplicateDisabled = false;
		recordListUnlinkDisabled = false;
		recordListConfirmRemove = false;
		recordListSuperCompact = false;
		recordListAllowedSuperCompact = ['list', 'listSmall'];
		recordListOrderByField?: string;
		recordListDynamicHandler: string | null = null;
		recordListButtonsPosition = 'Bottom';
		createAsModal = false;
		recordListSectionMode = false;
		recordListSectionCollapsible = false;
		recordListSectionCollapseThreshold: number | null = null;
		autocompleteDisabled = false;

		declare defs: Defs;
		filter?: unknown;
		url?: string;
		relatedListFiltersDisabled?: boolean;
		panelName?: string;
		link?: string;
		layoutName?: string;
		defaultOrder?: string;
		defaultOrderBy?: string;
		listViewName?: string;
		rowActionsView?: string;
		viewModalView?: string;
		filterList?: unknown;
		declare createDisabled?: boolean;
		declare selectRecordsView: string;
		mandatorySelectAttributeList?: string[];
		recordListMandatorySelectAttributeList?: string[];
		declare nameHash: Record<string, string>;
		declare foreignScope: string;
		declare model: Model;
		declare name: string;
		declare mode: string;
		declare entityType?: string;
		title?: string;
		declare MODE_LIST: string;
		declare options: Record<string, unknown>;
		declare params: Record<string, unknown>;
		declare events: Record<string, (() => void) | ((e?: JQuery.ClickEvent) => void)>;

		override init(): void {
			super.init();

			this.off('invalid');

			this._processOption('defaultSelectFilters', {});
			this._processOption('columnListEnabled');
			this._processOption('recordListEnabled');
			this._processOption('recordListCreateDisabled');
			this._processOption('recordListLinkDisabled');
			this._processOption('recordListRemoveDisabled');
			this._processOption('recordListDuplicateDisabled');
			this._processOption('recordListUnlinkDisabled');
			this._processOption('recordListConfirmRemove');
			this._processOption('recordListSuperCompact', false);
			this._processOption('recordListAllowedSuperCompact', ['list', 'listSmall']);
			this._processOption('recordListOrderByField');
			this._processOption('recordListLayout');
			this._processOption('recordListLayoutSuperCompact', 'listSmall');
			this._processOption('recordListDynamicHandler', null);
			this._processOption('recordListButtonsPosition', 'Bottom');
			this._processOption('createAsModal', false);
			this._processOption('enableShowDisplayList');
			this._processOption('recordListSectionMode', false);
			this._processOption('recordListSectionCollapsible', false);
			this._processOption('recordListSectionCollapseThreshold', null);

			if (this.recordListEnabled) {
				this.autocompleteDisabled = true;
			} else if (this.columnListEnabled) {
				this.columnList = new ColumnList(this);
			}
		}

		override renderLinks(): void {
			if (!this.recordListEnabled) {
				return super.renderLinks();
			}
		}

		_processOption(key: string, def: unknown = null): void {
			(this as Record<string, unknown>)[key] = this.options[key] ?? this.params[key] ?? (this as Record<string, unknown>)[key] ?? def;
		}

		override setup(): void {
			super.setup();

			if (this.columnList) {
				this.columnList.setup();
				return;
			}

			if (this.isSearchMode() || this.isListMode()) {
				this.recordListEnabled = false;
			}

			if (this.recordListSuperCompact) {
				if (!this.recordListAllowedSuperCompact.includes(this.mode)) {
					this.recordListSuperCompact = false;
				}
			}
			if (!this.recordListEnabled) {
				if (!this.recordListSuperCompact) {
					return;
				}
			}

			this.setupEvents();

			const key = Object.keys(this.events).find(key => key.includes('[data-action="selectLink"]'));

			if (key) {
				delete this.events[key];
			}
		}

		setupEvents(): void {
			this.events['click [data-action="addItem"]'] = () => {
				if (this.createAsModal) {
					this.createRelated();
				} else {
					this.addItem();
				}
			};

			this.events['click [data-action="linkItems"]'] = () => this.linkItems();

			this.events['click [data-action="viewRelatedList"]'] = this.actionViewRelatedList.bind(this);

			if (this.recordListSuperCompact) {
				this.events['click [data-action="showRecordListPopup"]'] = () => this.showRecordListPopup();
			}
		}

		actionViewRelatedList(data: { title?: string; url?: string; viewOptions?: Record<string, unknown> } = {}): void {
			const viewName =
				(this.getMetadata().get([
					'clientDefs',
					this.model.entityType,
					'relationshipPanels',
					this.name,
					'viewModalView',
				]) as string) ||
				(this.getMetadata().get([
					'clientDefs',
					this.entityType ||
						(this.collection && (this.collection.entityType || (this.collection as unknown as { name?: string }).name)) ||
						this.model.entityType,
					'modalViews',
					'relatedList',
				]) as string) ||
				this.viewModalView ||
				'viacrm:views/modals/related-list';

			const scope = this.collection!.entityType;

			let filter = this.filter;

			this.url =
				this.collection!.parentModel!.urlRoot + '/' + this.collection!.parentModel!.id + '/' + this.defs.name;

			if (this.relatedListFiltersDisabled) {
				filter = null;
			}

			const options: Record<string, unknown> = {};
			if (data.viewOptions) {
				for (const item in data.viewOptions) {
					options[item] = data.viewOptions[item];
				}
			}

			Espo.Ui.notifyWait();

			this.createView(
				'modalRelatedList',
				viewName,
				{
					model: this.model,
					panelName: this.panelName,
					link: this.link,
					scope: scope,
					defs: this.defs,
					title: data.title || this.title,
					filterList: this.filterList,
					filter: filter,
					layoutName: this.layoutName,
					defaultOrder: this.defaultOrder,
					defaultOrderBy: this.defaultOrderBy,
					url: data.url || this.url,
					listViewName: this.listViewName,
					createDisabled: !this.isCreateAvailable(scope!),
					selectDisabled: !this.isSelectAvailable(scope!),
					rowActionsView: this.rowActionsView,
					panelCollection: this.collection,
					filtersDisabled: this.relatedListFiltersDisabled,
					filters: this.getSelectFilters(),
				},
				(view: ModalView & { trigger(event: string, data: unknown, element: unknown): void }) => {
					Espo.Ui.notify(false);

					view.render();

					this.listenTo(view, 'action', (event: unknown, element: unknown) => {
						Espo.Utils.handleAction(this, event, element);
					});

					this.listenToOnce(view, 'close', () => {
						this.clearView('modalRelatedList');
					});
				},
			);
		}

		isCreateAvailable(_scope?: string): boolean {
			return !!this.defs.create;
		}

		isSelectAvailable(_scope?: string): boolean {
			return !!this.defs.select;
		}

		createRelated(): void {
			const viewName =
				(this.getMetadata().get(['clientDefs', this.foreignScope, 'modalViews', 'edit']) as string) || 'views/modals/edit';

			this.createView(
				'quickCreate',
				viewName,
				{
					scope: this.foreignScope,
				},
				(view: ModalView) => {
					view.actionSave = function (this: ModalView) {
						this.trigger('after:save', this.getRecordView().model);

						this.dialog.close();
					};

					view.render();
					view.notify(false);

					this.listenToOnce(view, 'after:save', (model: Model) => {
						this.addItem(model.attributes);
					});
				},
			);
		}

		override getDetailLinkHtml(id: string, name?: string): string {
			if (this.columnList) {
				return this.columnList.getDetailLinkHtml(id, name);
			}

			return super.getDetailLinkHtml(id, name);
		}

		getBasicLinkHtml(id: string, name?: string): string {
			name = name || this.nameHash[id] || id;
			if (!name && id) {
				name = this.translate(this.foreignScope, 'scopeNames') as string;
			}
			const iconHtml = this.isDetailMode() ? this.getIconHtml(id) : '';

			const $a = $('<a>').attr('href', this.getUrl(id)).attr('data-id', id).text(name);

			if (this.mode === this.MODE_LIST) {
				$a.addClass('text-default');
			}

			if (iconHtml) {
				$a.prepend(iconHtml);
			}

			return $a.get(0)!.outerHTML;
		}

		override addLink(id: string, name?: string): void {
			if (this.columnList) {
				this.columnList.addLink(id, name);
			} else {
				super.addLink(id, name);
			}
		}

		override addLinkHtml(id: string, name?: string): void {
			if (this.columnList) {
				return this.columnList.addLinkHtml(id, name);
			}

			return super.addLinkHtml(id, name);
		}

		getBasicLinkElement(id: string, name?: string): JQuery {
			const $container = this.$el.find('.link-container');

			const $el = $('<div>')
				.addClass('link-' + id)
				.addClass('list-group-item')
				.attr('data-id', id);

			$el.text(name || id).append('&nbsp;');

			$el.prepend(
				$('<a>')
					.addClass('pull-right')
					.attr('role', 'button')
					.attr('tabindex', '0')
					.attr('data-id', id)
					.attr('data-action', 'clearLink')
					.append($('<span>').addClass('fas fa-times')),
			);

			$container.append($el);

			return $el;
		}

		override onEditModeSet(): void {
			if (this.recordListEnabled && this.collection && this.recordListOrderByField) {
				this.collection.orderByDefaultOrder?.();
			}

			return super.onEditModeSet();
		}

		override onDetailModeSet(): void {
			if (this.recordListEnabled && this.collection && this.recordListOrderByField) {
				this.collection.resetOrderToDefault?.();
			}

			return super.onDetailModeSet();
		}

		override prepare(): Promise<void> {
			if (!this.recordListEnabled) {
				return super.prepare();
			}

			return this.prepareSeedModel()
				.then(() => this.prepareCollection())
				.then(() => this.loadCollectionModels())
				.then(() => this.prepareRecordListView());
		}

		override initInlineEdit(): void {
			super.initInlineEdit();

			this.get$cell().children('.inline-edit-link').addClass('link-multiple-inline-edit');
		}

		override getSelectFilters(): Record<string, unknown> {
			if (this.defaultSelectFilters) {
				return this.defaultSelectFilters;
			}

			const defaultSelectFiltersParam = this.getFieldParamValue('defaultSelectFilters');

			return typeof defaultSelectFiltersParam === 'object' && defaultSelectFiltersParam !== null
				? defaultSelectFiltersParam as Record<string, unknown>
				: {};
		}

		validateRecordList(): boolean {
			if (!this.recordListEnabled) {
				return false;
			}

			return (this.getView('list') as RecordListView).validate();
		}

		override validate(): boolean {
			const parentValidation = super.validate();

			if (this.columnList) {
				return this.columnList.validate(parentValidation);
			}

			return parentValidation;
		}

		override validateRequired(): boolean {
			if (this.columnList) {
				return this.columnList.validateRequired();
			} else if (!this.recordListEnabled) {
				return super.validateRequired();
			}

			if (this.isRequired()) {
				const value = this.getRecordList();

				if (!value || value.length === 0) {
					const msg = (this.translate('fieldIsRequired', 'messages') as string).replace('{field}', this.getLabelText());

					this.showValidationMessage(msg, '.recordList');

					return true;
				}
			}

			return false;
		}

		override validateMaxCount(): boolean {
			if (!this.recordListEnabled) {
				return super.validateMaxCount();
			}

			const maxCount = this.params.maxCount as number | undefined;

			if (!maxCount) {
				return false;
			}

			const value = this.getRecordList();

			if (!value) {
				return false;
			}

			if (value.length <= maxCount) {
				return false;
			}

			const msg = (this.translate('fieldExceedsMaxCount', 'messages') as string)
				.replace('{field}', this.getLabelText())
				.replace('{maxCount}', maxCount.toString());

			this.showValidationMessage(msg);

			return true;
		}

		prepareSeedModel(): Promise<Model> {
			if (this.seed) {
				return Promise.resolve(this.seed);
			}

			return new Promise(resolve => {
				this.getModelFactory().create(this.foreignScope, (model: Model) => {
					this.seed = model;
					resolve(model);
				});
			});
		}

		prepareCollection(): Promise<typeof this.collection> {
			if (this.collection || !this.recordListEnabled) {
				return Promise.resolve(this.collection);
			}

			return new Promise(resolve => {
				this.getCollectionFactory().create(this.foreignScope, (collection: typeof this.collection) => {
					const orgFetch = collection!.fetch.bind(collection);

					this.collection = collection;
					this.collection!.parentModel = this.model;
					this.collection!.fetch = (options?: Record<string, unknown>) => {
						if (this.model.isNew() || (this.model.id as string).startsWith('cid')) {
							return Promise.resolve();
						}

						const url = 'RecordList/' + this.model.name + '/' + this.model.id + '/' + this.name;
						this.collection!.url = this.collection!.urlRoot = url;

						return orgFetch(options);
					};

					if (this.recordListOrderByField) {
						this.collection!.orderBy = this.collection!.defaultOrderBy = this.recordListOrderByField;
						this.collection!.order = this.collection!.defaultOrder = 'asc';

						this.collection!.orderByDefaultOrder = () => {
							this.collection!.models.sort((modelA: Model, modelB: Model) => {
								const orderA = modelA.get(this.recordListOrderByField!) as number;
								const orderB = modelB.get(this.recordListOrderByField!) as number;

								return orderA - orderB;
							});
						};
					}

					resolve(this.collection);
				});
			});
		}

		prepareRecordListView(options?: Record<string, unknown>): Promise<RecordListView | void> {
			options = options || {};

			if (this.hasView('list') && (this.getView('list') as RecordListView).isBeingRendered()) {
				return Promise.resolve();
			}

			options = Object.assign(options, {
				collection: this.collection,
				selector: '.recordList',
				layoutName: this.recordListLayout,
				mode: this.isEditMode() ? 'edit' : 'list',
				rowActionsDisabled: this.isEditMode(),
				removeActionDisabled: this.recordListRemoveDisabled,
				duplicateActionDisabled: this.recordListDuplicateDisabled,
				unlinkActionDisabled: this.recordListUnlinkDisabled,
				confirmRemove: this.recordListConfirmRemove,
				dynamicHandlerClassName: this.recordListDynamicHandler,
				seed: this.seed,
				mandatorySelectAttributeList:
					(this.params.recordListMandatorySelectAttributeList as string[]) ||
					this.recordListMandatorySelectAttributeList ||
					null,
				showMore: true,
				recordList: true,
				checkboxes: (this.params.checkboxesEnabled as boolean) || false,
				recordListOrderByField: this.recordListOrderByField,
				link: this.name,
				parentId: this.model.id,
				parentEntityType: this.model.name,
				sectionMode: this.recordListSectionMode,
				sectionCollapsible: this.recordListSectionCollapsible,
				sectionCollapseThreshold: this.recordListSectionCollapseThreshold,
			});

			this.prepareRecordListViewOptions(options);

			return this.createView('list', this.recordListView, options).then((view: RecordListView) => {
				this.listenTo(view, 'change', () => {
					this.trigger('change');
				});

				return view;
			});
		}

		prepareRecordListViewOptions(_options: Record<string, unknown>): void {}

		loadCollectionModels(): Promise<void> {
			const recordList = this.getRecordList() || [];

			this.collection!.reset(null, {silent: true});

			recordList.forEach((data: Record<string, unknown>) => {
				this.addItem(data, true);
			});

			this.collection!.total = recordList.length;

			return Promise.resolve();
		}

		override data(): LinkMultipleFieldData {
			const data = super.data();
			if (this.columnList) {
				return this.columnList.data(data);
			}
			const ids = (this.model.get(this.idsName) as string[]) || [];

			data.size = ids.length;
			data.recordListSuperCompact = this.recordListSuperCompact;
			data.recordListEnabled = this.recordListEnabled;
			data.recordListCreateDisabled = this.recordListCreateDisabled;
			data.recordListLinkDisabled = this.recordListLinkDisabled;
			data.plusIconClass = this.plusIconClass;
			data.linkIconClass = this.linkIconClass;
			data.recordListButtonsPosition = this.recordListButtonsPosition;
			data.enableShowDisplayList = this.enableShowDisplayList;
			data.recordListSectionMode = this.recordListSectionMode;

			return data;
		}

		addItem(data: Record<string, unknown> | null = null, silent = false): Model {
			const model = this.seed!.clone();

			if (data) {
				model.set(data);
			} else {
				this.populateModel(model);
			}

			if (this.recordListOrderByField) {
				const currentOrder = model.get(this.recordListOrderByField);
				if (currentOrder === null || currentOrder === undefined) {
					model.set(this.recordListOrderByField, this.collection!.length + 1);
				}
			}

			if (!model.id) {
				model.id = 'cid' + Math.random().toString(36).substring(2, 10);
			}

			this.collection!.add(model, {silent: silent});

			if (!silent) {
				this.collection!.trigger('add-item', model);
				this.trigger('change');
			}

			return model;
		}

		processLinkedModelAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
			return attributes;
		}

		linkItems(): void {
			Espo.Ui.notifyWait();

			const viewName =
				(this.params.modalView as string) ||
				(this.getMetadata().get(['clientDefs', this.foreignScope, 'modalViews', 'select']) as string) ||
				this.selectRecordsView;

			this.createView(
				'dialog',
				viewName,
				{
					scope: this.foreignScope,
					parentModel: this.model,
					createButton: !this.createDisabled && this.mode !== 'search',
					filters: this.getSelectFilters(),
					boolFilterList: this.getSelectBoolFilterList(),
					primaryFilterName: this.getSelectPrimaryFilterName(),
					filterList: this.getSelectFilterList(),
					multiple: true,
					mandatorySelectAttributeList: this.mandatorySelectAttributeList,
					forceSelectAllAttributes: true,
				},
				(dialog: SelectDialogView) => {
					dialog.render();

					Espo.Ui.notify(false);

					this.listenToOnce(dialog, 'select', (models: Model | Model[]) => {
						this.clearView('dialog');

						if (!Array.isArray(models)) {
							models = [models];
						}

						models = models.filter(model => !this.collection!.has(model.id));

						if (!models.length) {
							return;
						}

						const collectionModels: Model[] = [];

						models.forEach(model => {
							const attributes = this.processLinkedModelAttributes(model.getClonedAttributes());

							collectionModels.push(this.addItem(attributes, true));
						});

						this.collection!.trigger('add-items', collectionModels);
						this.trigger('change');
					});
				},
			);
		}

		populateModel(model: Model): void {
			const thisModel = this.model;
			const context = this as unknown as typeof RecordBase.prototype;

			context.model = model;
			RecordBase.prototype.populateDefaults.call(context);

			this.model = thisModel;
		}

		getRecordList(): Record<string, unknown>[] {
			return this.model.get(this.name + 'RecordList') as Record<string, unknown>[];
		}

		override fetch(): Record<string, unknown> {
			if (this.columnList) {
				return this.columnList.fetch();
			}

			if (!this.recordListEnabled) {
				return super.fetch();
			}

			const data: Record<string, unknown> = {};

			if (this.getView('list')) {
				data[this.name + 'RecordList'] = (this.getView('list') as RecordListView).fetch();
			}

			return data;
		}

		showRecordListPopup(): void {
			this.prepareCollection().then(() => {
				this.collection!.fetch().then((response: { total?: number }) => {
					if (response.total && response.total > 0) {
						this.openPopupWithCollection();
					}
				});
			});
		}

		openPopupWithCollection(): void {
			const viewName = 'viacrm:views/modals/link-multiple/list';

			const collectionClone = this.collection!.clone();

			this.createView(
				'recordListPopup',
				viewName,
				{
					scope: this.foreignScope,
					collection: collectionClone,
					quickView: true,
					readOnly: true,
					model: this.model,
					mode: this.isEditMode() ? 'edit' : 'list',
					recordListLayoutSuperCompact: this.recordListLayoutSuperCompact,
				},
				(view: { render(): void }) => {
					view.render();
				},
			);
		}

		override afterRender(): void {
			super.afterRender();
			if (this.columnList) {
				this.columnList.afterRender();
			}
		}

		override getAttributeList(): string[] {
			const attributeList = super.getAttributeList();
			if (this.columnList) {
				return this.columnList.getAttributeList(attributeList);
			}
			return attributeList;
		}

		override initAutocomplete(id: string): void {
			if (this.columnList) {
				return this.columnList.initAutocomplete(id);
			}
		}
	},
);
