define(['views/record/list', 'autocrm:helpers/version'], (Dep, VersionHelper) => class extends Dep {
	mode = 'list';

	removeRowActionWidth = 25;

	removeActionDisabled = false;

	duplicateActionDisabled = false;
	unlinkActionDisabled = true;

	confirmRemove = false;

	sortRowActionWidth = 25;

	recordListOrderByField = null;

	dynamicHandlerClassName = null;

	_DynamicHandler = null;

	_modelListeners = {};

	pagination = false;

	buttonsDisabled = true;

	showCount = false;

	init() {
		super.init();

		this.mode = this.options.mode || this.mode;
		this.sectionMode = this.options.sectionMode || false;
	}

	setup() {
		super.setup();

		if (this.sectionMode) {
			this.template = 'autocrm:fields/link-multiple/record-list-section';
			// Initialize rowList for section mode
			this.rowList ??= [];
		}

		this.seed = this.options.seed;
		this.removeActionDisabled = this.options.removeActionDisabled || this.removeActionDisabled;
		this.duplicateActionDisabled = this.options.duplicateActionDisabled || this.duplicateActionDisabled;
		this.unlinkActionDisabled = this.options.unlinkActionDisabled ?? this.unlinkActionDisabled;
		this.confirmRemove = this.options.confirmRemove || this.confirmRemove;
		this.dynamicHandlerClassName = this.dynamicHandlerClassName || this.options.dynamicHandlerClassName;
		this.recordListOrderByField = this.options.recordListOrderByField || this.recordListOrderByField;

		if (this.dynamicHandlerClassName) {
			this.wait(
				Espo.loader.requirePromise(this.dynamicHandlerClassName).then(handler => {
					this._DynamicHandler = handler;
				}),
			);
		}

		this.listenTo(this.collection, 'add-item add-items', models => {
			if (!Array.isArray(models)) {
				models = [models];
			}

			this.addRecordsToList(models);
		});

		this.listenTo(this.collection, 'change', () => this.trigger('change'));

		this.on('after:save', () => {
			this.trigger('change');
		});
	}

	actionDuplicate(data) {
		data = data || {};

		const id = data.id;

		Espo.Ui.notifyWait();

		Espo.Ajax.postRequest(this.scope + '/action/getDuplicateAttributes', {id}).then(attributes => {
			Espo.Ui.notify(false);

			this.getParentView().addItem(attributes);

			this.collection.parentModel.save();
		});
	}

	addRecordsToList(models) {
		if (this.rowList.length === 0) {
			this.buildRows(() => {
				this.render();
			});

			return;
		}

		// Use correct container for section mode
		const $list = this.sectionMode
			? this.$el.find('.list-section-mode')
			: this.$el.find(this.listContainerEl);

		const versionHelper = new VersionHelper(this.getConfig());

		models.forEach(model => {
			if (this.sectionMode) {
				// For section mode, we need to create the container first, then build the row
				const $row = $(this.getRowContainerHtml(model.id));
				$list.append($row);

				this.buildRow(0, model, view => {
					view.render();
					// Trigger change event so parent field knows list updated
					this.trigger('change');
				});
			} else {
				this.buildRow(0, model, view => {
					if (versionHelper.isGreaterOrEqual('9.0.0')) {
						view._getPreparedElement(html => {
							const $row = $(this.getRowContainerHtml(model.id));

							$row.append(html);
							$list.append($row);

							view.setElement(view.options.el || $row);
							view._renderInDom(html);

							view._afterRender();
						});
					} else {
						view.getHtml(html => {
							const $row = $(this.getRowContainerHtml(model.id));

							$row.append(html);
							$list.append($row);

							view.setElement(view.options.el || $row);

							view._afterRender();
						});
					}
				});
			}
		});
	}

	afterRender() {
		super.afterRender();

		this.$el.children('.list').toggleClass('edit-mode', this.isEditMode());

		this.setupSortableRecordList();
		this.initTooltip();

		// Apply table styling
		this.applyTableStyling();

		// For section mode, ensure rows are rendered
		if (this.sectionMode && this.rowList) {
			this.rowList.forEach(id => {
				const view = this.getView(id);
				if (view && !view.isRendered()) {
					view.render();
				}
			});
		}
	}

	applyTableStyling() {
		const $table = this.$el.find('table.table');
		if ($table.length) {
			const minWidth = this.getTableMinWidth();
			$table.css({
				'min-width': minWidth,
				'max-width': 'unset'
			});
		}
	}

	isEditMode() {
		return this.mode === 'edit';
	}

	setupSortableRecordList() {
		if (!this.recordListOrderByField) {
			return;
		}

		if (!this.isEditMode()) {
			return;
		}

		const $list = this.sectionMode
			? this.$el.find('.list-section-mode')
			: this.$el.find(this.listContainerEl);

		$list.sortable({
			axis: 'y',
			handle: this.sectionMode ? '.section-header' : '[data-action="sort"]',
			items: this.sectionMode ? '.section-item' : 'tr',
			cancel: '',
			stop: () => this.updateOrder(),
		});
	}

	updateOrder() {
		const $list = this.sectionMode
			? this.$el.find('.list-section-mode')
			: this.$el.find(this.listContainerEl);
		const modelMap = new Map();

		this.collection.forEach(model => {
			modelMap.set(model.id, model);
		});

		const selector = this.sectionMode ? '.section-item' : 'tr';
		$list.children(selector).each((i, item) => {
			const modelId = $(item).data('id');
			const model = modelMap.get(modelId);

			if (!model) {
				throw new Error(`Model with id ${modelId} not found`);
			}

			model.set(this.recordListOrderByField, i + 1);
		});

		this.collection.orderByDefaultOrder();

		this.trigger('change');
	}

	buildRows(callback) {
		if (!this.sectionMode) {
			return super.buildRows(callback);
		}

		// For section mode, ensure we have a layout before building rows
		if (!this.listLayout) {
			// Wait for layout to be loaded first
			return super.buildRows(callback);
		}

		// Initialize rowList for section mode
		this.rowList = [];

		this.collection.forEach((model, i) => {
			this.buildRow(i, model, () => {
			});
		});

		if (callback) {
			callback();
		}
	}

	buildRow(i, model, callback) {
		if (!this.sectionMode) {
			return super.buildRow(i, model, view => {
				this.fetchRowToCollection(view);
				this.initDynamicHandlerForRow(model, view);
				callback(view);
			});
		}

		// For section mode, use original listLayout, not internal layout
		const key = model.id;

		// Add to rowList for section mode
		this.rowList.push(key);

		// Ensure we have the layout loaded
		const createRowView = () => {
			const viewName = 'autocrm:views/fields/link-multiple/record-list-row-section';

			this.createView(key, viewName, {
				model: model,
				acl: {
					edit: this.getAcl().checkModel(model, 'edit')
				},
				selector: this.getRowSelector(model.id),
				parent: this.options.el + ' .list-section-mode',
				selectable: this.checkboxes,
				mode: this.mode,
				listLayout: this.listLayout,  // Pass original listLayout, not internal
				checkboxes: this.checkboxes,
				readOnly: this.readOnly,
				removeActionDisabled: this.removeActionDisabled,
				duplicateActionDisabled: this.duplicateActionDisabled,
				unlinkActionDisabled: this.unlinkActionDisabled,
				recordListOrderByField: this.recordListOrderByField,
				collapsible: this.options.sectionCollapsible || false,
				collapseThreshold: this.options.sectionCollapseThreshold || 3
			}, view => {
				this.fetchRowToCollection(view);
				this.initDynamicHandlerForRow(model, view);
				callback(view);
			});
		};

		// If layout is already loaded, create view immediately
		if (this.listLayout) {
			createRowView();
		} else {
			// Wait for layout to be loaded
			this._loadListLayout(listLayout => {
				this.listLayout = listLayout;
				createRowView();
			});
		}
	}

	getRowSelector(id) {
		if (this.sectionMode) {
			return `.section-item[data-id="${id}"]`;
		}
		return `tr.list-row[data-id="${id}"]`;
	}

	getRowContainerHtml(id) {
		if (this.sectionMode) {
			return `<div class="section-item" data-id="${id}"></div>`;
		}
		return super.getRowContainerHtml(id);
	}

	getListLayout() {
		// Return the listLayout that should be set by the parent view
		return this.listLayout || [];
	}

	initDynamicHandlerForRow(model, view) {
		if (!this._DynamicHandler) {
			return;
		}

		const dynamicHandler = new this._DynamicHandler(view, this, this.collection.parentModel);

		this.prepareDynamicHandlerObj(dynamicHandler);

		const previousCallback = this._modelListeners[model.id] || null;
		const callback = this._dynamicHandlerListener.bind(this, dynamicHandler);

		if (previousCallback) {
			this.stopListening(model, 'change', previousCallback);
		}

		this.listenTo(model, 'change', callback);

		this._modelListeners[model.id] = callback;

		dynamicHandler._rowRender();
	}

	/**
		 * To be extended.
		 *
		 * @protected
		 */
	// eslint-disable-next-line no-unused-vars
	prepareDynamicHandlerObj(dynamicHandler) {
	}

	_dynamicHandlerListener(dynamicHandler, model, o) {
		if ('onChange' in dynamicHandler) {
			dynamicHandler.onChange.call(dynamicHandler, model, o);
		}

		const changedAttributes = model.changedAttributes() || {};

		for (const attr in changedAttributes) {
			const methodName = 'onChange' + Espo.Utils.upperCaseFirst(attr);

			if (methodName in dynamicHandler) {
				dynamicHandler[methodName](model, changedAttributes[attr], o);
			}
		}
	}

	validate() {
		for (const row of this.rowList) {
			if (!this.hasView(row)) {
				continue;
			}

			const rowView = this.getView(row);

			for (const fieldView of Object.values(rowView.nestedViews)) {
				if (
					typeof fieldView.validate === 'function' &&
						fieldView.isEditMode() &&
						!fieldView.disabled &&
						!fieldView.readOnly &&
						fieldView.validate()
				) {
					return true;
				}
			}
		}

		return false;
	}

	_getHeaderDefs() {
		const headerDefs = super._getHeaderDefs(this);


		if (!this.isEditMode()) {
			return headerDefs;
		}

		const listLayoutMap = {};

		(this.listLayout || []).forEach(item => {
			listLayoutMap[item.name] = item;
		});

		headerDefs.forEach(def => {
			def.isSortable = false;

			const name = def.name;
			let required = this.seed.getFieldParam(name, 'required');

			if (listLayoutMap[name] && listLayoutMap[name].params && 'required' in listLayoutMap[name].params) {
				required = listLayoutMap[name].params.required;
			}

			if (required) {
				def.label += ' *';
			}
		});

		if (!this.removeActionDisabled) {
			headerDefs.push({
				className: 'remove-column',
				width: this.removeRowActionWidth + 'px',
			});
		}

		if (this.recordListOrderByField) {
			headerDefs.push({
				className: 'sort-column',
				width: this.sortRowActionWidth + 'px',
			});
		}

		if (!this.duplicateActionDisabled) {
			headerDefs.push({
				className: 'duplicate-column',
				width: this.sortRowActionWidth + 'px',
			});
		}

		if (!this.unlinkActionDisabled) {
			headerDefs.push({
				className: 'unlink-column',
				width: this.sortRowActionWidth + 'px',
			});
		}

		return headerDefs;
	}

	getItemEl(model, item) {
		return (
			this.getSelector() +
				' .list-row[data-id="' +
				model.id +
				'"]' +
				' td.cell[data-name="' +
				item.columnName +
				'"]' +
				' .cell-wrapper'
		);
	}

	prepareInternalLayout(internalLayout, model) {
		super.prepareInternalLayout(internalLayout, model);

		internalLayout.forEach(item => {
			item.options = item.options || {};
			item.options.columnName = item.columnName;

			if (['buttons', 'removeCrossField', 'sortMagnetField', 'duplicateField'].includes(item.name)) {
				return;
			}

			if (this.isEditMode()) {
				if (!item.options) {
					item.options = {};
				}

				item.options.mode = 'edit';
			}

			item.tag = 'div';
			item.class = 'cell-wrapper';
		});
	}

	_convertLayout(listLayout, model) {
		const layout = super._convertLayout(listLayout, model);

		if (this.isEditMode()) {
			if (!this.removeActionDisabled) {
				layout.push({
					columnName: 'remove-cross',
					name: 'removeCrossField',
					view: 'autocrm:views/record/row-actions/remove-cross',
					options: {},
				});
			}

			if (!this.duplicateActionDisabled) {
				layout.push({
					columnName: 'duplicate',
					name: 'duplicateField',
					view: 'autocrm:views/record/row-actions/duplicate',
					options: {},
				});
			}

			if (this.recordListOrderByField) {
				layout.push({
					columnName: 'sort-magnet',
					name: 'sortMagnetField',
					view: 'autocrm:views/record/row-actions/sort-magnet',
					options: {},
				});
			}

			if (!this.unlinkActionDisabled) {
				layout.push({
					columnName: 'unlink-chain',
					name: 'unlinkChainField',
					view: 'autocrm:views/record/row-actions/unlink-chain',
					options: {},
				});
			}

		}

		return layout;
	}

	actionQuickUnlink(data) {
		const id = data.id;

		this.confirm({
			message: this.translate('unlinkRecordConfirmation', 'messages'),
			confirmText: this.translate('Unlink'),
		}, () => {
			Espo.Ui.notifyWait();
			const parentEntityType = this.collection.parentModel.name;
			const parentLinkName = this.options.link;
			const linkName = Object.keys(this.collection.defs.links).find(name => {
				const link = this.collection.defs.links[name];
				return link.entity === parentEntityType && link.foreign === parentLinkName;
			});
			if (!linkName) {
				console.error("Link not found for entity: ", parentEntityType, " with parent link: ", parentLinkName, " and link name: ", linkName);
				Espo.Ui.error(this.translate('Link name not found'));
				return;
			}
			const model = this.collection.get(id);
			const linkType = model.defs.links[linkName].type;
			switch (linkType) {
				case 'hasMany':
					model.set(linkName + 'Ids', model.get(linkName + 'Ids').filter(presentId => presentId !== id));
					break;
				case 'belongsTo':
				case 'belongsToParent':
					model.set(linkName + 'Id', null);
					break;
				default:
					console.error("Unknown link type: ", linkType, " for link: ", linkName, " in entity: ", parentEntityType, " with parent link: ", parentLinkName);
					Espo.Ui.error(this.translate('Unknown link type'));
					return;
			}
			model.save().then(() => {
				Espo.Ui.success(this.translate('Unlinked'));
				this.collection.fetch();
				this.model.trigger('after:unrelate');
				this.model.trigger('after:unrelate:' + this.link);
			});
		});
	}

	actionQuickRemove(data) {
		if (!this.isEditMode()) {
			super.actionQuickRemove(data);

			return;
		}

		const remove = () => {
			data = data || {};

			const id = data.id;

			if (!id) {
				return;
			}

			// Use `find` instead of `get` because new models may not have `id` attribute (only `id` property)
			const model = this.collection.models.find(model => model.id === id);

			if (model) {
				this.collection.remove(model.cid);
				this.removeRecordFromList(id);
			}
		};

		if (this.confirmRemove) {
			this.confirm(this.translate('confirmation', 'messages'), remove);
		} else {
			remove();
		}
	}

	removeRecordFromList(id) {
		super.removeRecordFromList(id);

		this.trigger('change');
	}

	getViewFields(view) {
		return Object.values(view.nestedViews).filter(view => typeof view.fetch === 'function');
	}

	// Important, although it might not seem so at first glance.
	// It ensures that the proper attributes are set (e.g., for validation) even if no 'change' event is triggered,
	// for example, when user saves without editing any record list fields
	fetchRowToCollection(rowView) {
		if (!this.isEditMode()) {
			return;
		}

		rowView.once('after:render', () => {
			for (const fieldView of this.getViewFields(rowView)) {
				if (fieldView.isEditMode() && fieldView.$el.length) {
					fieldView.fetchToModel();
				}
			}
		});
	}

	fetch() {
		return this.collection.models.map(model => model.getClonedAttributes());
	}

	getTableMinWidth() {
		let totalPercentage = 0;

		const headerDefs = this._getHeaderDefs();
		headerDefs.forEach(def => {
			if (def.width && def.width.includes('%')) {
				totalPercentage += parseFloat(def.width);
			}
		});

		return totalPercentage + '%';
	}

	data() {
		if (!this.sectionMode) {
			return super.data();
		}

		// For section mode, provide data for the template
		const data = {
			rowDataList: this.rowList ? this.rowList.map(id => ({id})) : [],
			collectionLength: this.collection ? this.collection.length : 0
		};

		return data;
	}


	initTooltip() {
		const $headerCells = this.$el.find('th.field-header-cell[data-name]');

		$headerCells.each((_index, headerCell) => {
			const $headerCell = $(headerCell);
			const fieldName = $headerCell.attr('data-name');
			if (!fieldName) return;

			const fieldDefs = this.getMetadata().get(['entityDefs', this.scope, 'fields', fieldName]);
			if (!fieldDefs || !(fieldDefs.tooltip === true || typeof fieldDefs.tooltip === 'string')) {
				return;
			}

			if ($headerCell.find('.field-info').length > 0) return;

			const $a = $('<a>')
				.attr('role', 'button')
				.attr('tabindex', '-1')
				.addClass('text-muted field-info')
				.append($('<span>').addClass('fas fa-info-circle'));

			const $label = $headerCell.find('a.sort');
			if ($label.length > 0) {
				$label.append(' ').append($a);
			} else {
				$headerCell.append(' ').append($a);
			}

			let tooltipText = '';

			if (typeof fieldDefs.tooltip === 'string') {
				const [scope, field] = fieldDefs.tooltip.includes('.') ?
					fieldDefs.tooltip.split('.') :
					[this.scope, fieldDefs.tooltip];

				tooltipText = this.translate(field, 'tooltips', scope);
			}

			tooltipText = tooltipText || this.translate(fieldName, 'tooltips', this.scope) || '';

			if (this.getHelper && this.getHelper().transformMarkdownText) {
				tooltipText = this.getHelper()
					.transformMarkdownText(tooltipText, {linksInNewTab: true}).toString();
			}

			if (tooltipText && window.Espo?.Ui?.popover) {
				window.Espo.Ui.popover($a, {
					placement: 'bottom',
					content: tooltipText,
					preventDestroyOnRender: true,
					trigger: 'hover'
				}, this);
			}
		});
	}

});
