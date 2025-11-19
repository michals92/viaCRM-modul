define(['views/fields/link-multiple', 'autocrm:views/fields/link-multiple/column-list', 'views/record/base'], (
	Dep,
	ColumnList,
	RecordBase,
) => class extends Dep {
	detailTemplate = 'autocrm:fields/link-multiple/detail';
	listTemplate = 'autocrm:fields/link-multiple/list';
	editTemplate = 'autocrm:fields/link-multiple/edit';

	recordListEnabled = false;

	columnListEnabled = false;
	columnList = false;

	enableShowDisplayList = false;

	recordListLayout = 'listSmall';

	recordListLayoutSuperCompact = 'listSmall';

	recordListView = 'autocrm:views/fields/link-multiple/record-list';

	seed = null;

	collection = null;

	validations = ['required', 'recordList'];

	plusIconClass = 'fas fa-plus';

	linkIconClass = 'fas fa-link';

	init() {
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

	renderLinks() {
		if (!this.recordListEnabled) {
			return super.renderLinks();
		}
	}

	_processOption(key, def = null) {
		this[key] = this.options[key] ?? this.params[key] ?? this[key] ?? def;
	}

	setup() {
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

		delete this.events[key];
	}

	setupEvents() {
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

	actionViewRelatedList(data = {}) {
		const viewName =
				this.getMetadata().get([
					'clientDefs',
					this.model.entityType,
					'relationshipPanels',
					this.name,
					'viewModalView',
				]) ||
				this.getMetadata().get([
					'clientDefs',
					this.entityType ||
						(this.collection && (this.collection.entityType || this.collection.name)) ||
						this.model.entityType,
					'modalViews',
					'relatedList',
				]) ||
				this.viewModalView ||
				'autocrm:views/modals/related-list';

		const scope = this.collection.entityType;

		let filter = this.filter;

		this.url =
				this.collection.parentModel.urlRoot + '/' + this.collection.parentModel.id + '/' + this.defs.name;

		if (this.relatedListFiltersDisabled) {
			filter = null;
		}

		const options = {};
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
				createDisabled: !this.isCreateAvailable(scope),
				selectDisabled: !this.isSelectAvailable(scope),
				rowActionsView: this.rowActionsView,
				panelCollection: this.collection,
				filtersDisabled: this.relatedListFiltersDisabled,
				filters: this.getSelectFilters(),
			},
			view => {
				Espo.Ui.notify(false);

				view.render();

				this.listenTo(view, 'action', (event, element) => {
					Espo.Utils.handleAction(this, event, element);
				});

				this.listenToOnce(view, 'close', () => {
					this.clearView('modalRelatedList');
				});
			},
		);
	}

	isCreateAvailable() {
		return !!this.defs.create;
	}

	isSelectAvailable() {
		return !!this.defs.select;
	}

	createRelated() {
		const viewName =
				this.getMetadata().get(['clientDefs', this.foreignScope, 'modalViews', 'edit']) || 'views/modals/edit';

		this.createView(
			'quickCreate',
			viewName,
			{
				scope: this.foreignScope,
			},
			view => {
				view.actionSave = function () {
					this.trigger('after:save', this.getRecordView().model);

					this.dialog.close();
				};

				view.render();
				view.notify(false);

				this.listenToOnce(view, 'after:save', model => {
					this.addItem(model.attributes);
				});
			},
		);
	}

	getDetailLinkHtml(id, name) {
		if (this.columnList) {
			return this.columnList.getDetailLinkHtml(id, name);
		}

		return super.getDetailLinkHtml(id, name);
	}

	// Helper method for initial render
	getBasicLinkHtml(id, name) {
		name = name || this.nameHash[id] || id;
		if (!name && id) {
			name = this.translate(this.foreignScope, 'scopeNames');
		}
		const iconHtml = this.isDetailMode() ? this.getIconHtml(id) : '';

		const $a = $('<a>').attr('href', this.getUrl(id)).attr('data-id', id).text(name);

		if (this.mode === this.MODE_LIST) {
			$a.addClass('text-default');
		}

		if (iconHtml) {
			$a.prepend(iconHtml);
		}

		return $a.get(0).outerHTML;
	}

	addLink(id, name) {
		if (this.columnList) {
			this.columnList.addLink(id, name);
		} else {
			super.addLink(id, name);
		}
	}

	addLinkHtml(id, name) {
		if (this.columnList) {
			return this.columnList.addLinkHtml(id, name);
		}

		return super.addLinkHtml(id, name);
	}

	// Helper method for initial render
	getBasicLinkElement(id, name) {
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

	onEditModeSet() {
		if (this.recordListEnabled && this.collection && this.recordListOrderByField) {
			this.collection.orderByDefaultOrder();
		}

		return super.onEditModeSet();
	}

	onDetailModeSet() {
		if (this.recordListEnabled && this.collection && this.recordListOrderByField) {
			this.collection.resetOrderToDefault();
		}

		return super.onDetailModeSet();
	}

	prepare() {
		if (!this.recordListEnabled) {
			return super.prepare();
		}

		return this.prepareSeedModel()
			.then(() => this.prepareCollection())
			.then(() => this.loadCollectionModels())
			.then(() => this.prepareRecordListView());
	}

	initInlineEdit() {
		super.initInlineEdit();

		this.get$cell().children('.inline-edit-link').addClass('link-multiple-inline-edit');
	}

	getSelectFilters() {
		if (this.defaultSelectFilters) {
			return this.defaultSelectFilters;
		}

		const defaultSelectFiltersParam = this.getFieldParamValue('defaultSelectFilters');

		// Due to ambiguity, Espo saves an empty object as an empty array in metadata. Thanks PHP!
		return typeof defaultSelectFiltersParam === 'object' && defaultSelectFiltersParam !== null
			? defaultSelectFiltersParam
			: {};
	}

	validateRecordList() {
		if (!this.recordListEnabled) {
			return false;
		}

		return this.getView('list').validate();
	}

	validate() {
		const parentValidation = super.validate();

		if (this.columnList) {
			return this.columnList.validate(parentValidation);
		}

		return parentValidation;
	}

	validateRequired() {
		if (this.columnList) {
			return this.columnList.validateRequired();
		} else if (!this.recordListEnabled) {
			return super.validateRequired();
		}

		if (this.isRequired()) {
			const value = this.getRecordList();

			if (!value || value.length === 0) {
				const msg = this.translate('fieldIsRequired', 'messages').replace('{field}', this.getLabelText());

				this.showValidationMessage(msg, '.recordList');

				return true;
			}
		}

		return false;
	}

	validateMaxCount() {
		if (!this.recordListEnabled) {
			return super.validateMaxCount();
		}

		const maxCount = this.params.maxCount;

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

		const msg = this.translate('fieldExceedsMaxCount', 'messages')
			.replace('{field}', this.getLabelText())
			.replace('{maxCount}', maxCount.toString());

		this.showValidationMessage(msg);

		return true;
	}

	prepareSeedModel() {
		if (this.seed) {
			return Promise.resolve(this.seed);
		}

		return new Promise(resolve => {
			this.getModelFactory().create(this.foreignScope, model => {
				this.seed = model;
				resolve(model);
			});
		});
	}

	prepareCollection() {
		if (this.collection || !this.recordListEnabled) {
			return Promise.resolve(this.collection);
		}

		return new Promise(resolve => {
			this.getCollectionFactory().create(this.foreignScope, collection => {
				const orgFetch = collection.fetch;

				this.collection = collection;
				this.collection.parentModel = this.model;
				this.collection.fetch = options => {
					if (this.model.isNew() || this.model.id.startsWith('cid')) {
						return Promise.resolve();
					}

					const url = 'RecordList/' + this.model.name + '/' + this.model.id + '/' + this.name;
					this.collection.url = this.collection.urlRoot = url;

					return orgFetch.call(this.collection, options);
				};

				if (this.recordListOrderByField) {
					this.collection.orderBy = this.collection.defaultOrderBy = this.recordListOrderByField;
					this.collection.order = this.collection.defaultOrder = 'asc';

					this.collection.orderByDefaultOrder = () => {
						this.collection.models.sort((modelA, modelB) => {
							const orderA = modelA.get(this.recordListOrderByField);
							const orderB = modelB.get(this.recordListOrderByField);

							return orderA - orderB;
						});
					};
				}

				resolve(this.collection);
			});
		});
	}

	prepareRecordListView(options) {
		options = options || {};

		if (this.hasView('list') && this.getView('list').isBeingRendered()) {
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
					this.params.recordListMandatorySelectAttributeList ||
					this.recordListMandatorySelectAttributeList ||
					null,
			showMore: true,
			recordList: true,
			checkboxes: this.params.checkboxesEnabled || false,
			recordListOrderByField: this.recordListOrderByField,
			link: this.name,
			parentId: this.model.id,
			parentEntityType: this.model.name,
			sectionMode: this.recordListSectionMode,
			sectionCollapsible: this.recordListSectionCollapsible,
			sectionCollapseThreshold: this.recordListSectionCollapseThreshold,
		});

		this.prepareRecordListViewOptions(options);

		return this.createView('list', this.recordListView, options).then(view => {
			this.listenTo(view, 'change', () => {
				this.trigger('change');
			});

			return view;
		});
	}

	prepareRecordListViewOptions(_options) {}

	loadCollectionModels() {
		const recordList = this.getRecordList() || [];

		this.collection.reset(null, { silent: true });

		recordList.forEach(data => {
			this.addItem(data, true);
		});

		this.collection.total = recordList.length;

		return Promise.resolve();
	}

	data() {
		const data = super.data();
		if (this.columnList) {
			return this.columnList.data(data);
		}
		const ids = this.model.get(this.idsName) || [];

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

	addItem(data = null, silent = false) {
		const model = this.seed.clone();

		if (data) {
			model.set(data);
		} else {
			this.populateModel(model);
		}

		if (this.recordListOrderByField) {
			// Set order if it doesn't exist or is null/undefined
			const currentOrder = model.get(this.recordListOrderByField);
			if (currentOrder === null || currentOrder === undefined) {
				model.set(this.recordListOrderByField, this.collection.length + 1);
			}
		}

		if (!model.id) {
			model.id = 'cid' + Math.random().toString(36).substring(2, 10);
		}

		this.collection.add(model, { silent: silent });

		if (!silent) {
			this.collection.trigger('add-item', model);
			this.trigger('change');
		}

		return model;
	}

	processLinkedModelAttributes(attributes) {
		return attributes;
	}

	linkItems() {
		Espo.Ui.notifyWait();

		const viewName =
				this.params.modalView ||
				this.getMetadata().get(['clientDefs', this.foreignScope, 'modalViews', 'select']) ||
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
			dialog => {
				dialog.render();

				Espo.Ui.notify(false);

				this.listenToOnce(dialog, 'select', models => {
					this.clearView('dialog');

					if (!Array.isArray(models)) {
						models = [models];
					}

					models = models.filter(model => !this.collection.has(model.id));

					if (!models.length) {
						return;
					}

					const collectionModels = [];

					models.forEach(model => {
						const attributes = this.processLinkedModelAttributes(model.getClonedAttributes());

						collectionModels.push(this.addItem(attributes, true));
					});

					this.collection.trigger('add-items', collectionModels);
					this.trigger('change');
				});
			},
		);
	}

	populateModel(model) {
		const thisModel = this.model;
		const context = this;

		context.model = model;
		RecordBase.prototype.populateDefaults.call(context);

		this.model = thisModel;
	}

	getRecordList() {
		return this.model.get(this.name + 'RecordList');
	}

	fetch() {
		if (this.columnList) {
			return this.columnList.fetch();
		}

		if (!this.recordListEnabled) {
			return super.fetch();
		}

		const data = {};

		if (this.getView('list')) {
			data[this.name + 'RecordList'] = this.getView('list').fetch();
		}

		return data;
	}

	showRecordListPopup() {
		this.prepareCollection().then(() => {
			this.collection.fetch().then(response => {
				if (response.total > 0) {
					this.openPopupWithCollection();
				}
			});
		});
	}

	openPopupWithCollection() {
		const viewName = 'autocrm:views/modals/link-multiple/list';

		const collectionClone = this.collection.clone();

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
			view => {
				view.render();
			},
		);
	}

	afterRender() {
		super.afterRender();
		if (this.columnList) {
			this.columnList.afterRender();
		}
	}

	getAttributeList() {
		const attributeList = super.getAttributeList();
		if (this.columnList) {
			return this.columnList.getAttributeList(attributeList);
		}
		return attributeList;
	}

	initAutocomplete(id) {
		if (this.columnList) {
			return this.columnList.initAutocomplete(id);
		}
	}
});
