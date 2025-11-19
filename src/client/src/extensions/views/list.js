extend(['autocrm:helpers/partitioned-view', 'autocrm:helpers/colorize'], (Dep, PartitionedViewHelper, ColorizeHelper) => class extends Dep {
	recordPartitionedView = 'autocrm:views/record/partitioned';
	recordGridView = 'autocrm:views/record/grid';
	recordUserKanbanView = 'autocrm:views/record/user-kanban';

	MODE_GRID = 'grid';
	MODE_USER_KANBAN = 'userKanban';

	init() {
		super.init();

		this.partitionedViewHelper = new PartitionedViewHelper(
			this.scope,
			this.getStorage(),
			this.getFieldManager(),
			this.getMetadata(),
		);

		this.colorizeHelper = new ColorizeHelper(
			this.getMetadata(),
			this.getUser()
		);

		this.listenTo(this.collection, 'sync', () => {
			setTimeout(() => {
				this.colorizeHelper.applyColorsToRows(this, this.collection, this.entityType || this.scope);
			}, 100);
		});
	}

	afterRender() {
		super.afterRender && super.afterRender();
		this.colorizeHelper.applyColorsToRows(this, this.collection, this.entityType || this.scope);
	}

	/**
		 * Override buildRow to apply colors when rows are created
		 */
	buildRow(i, model, callback) {
		const entityType = this.entityType || this.scope;

		const color = this.colorizeHelper.getColor(model, entityType, this);

		super.buildRow(i, model, view => {
			// Apply color to the row view after it's created
			this.colorizeHelper.applyColorToRow(view, color, model.id);

			if (callback) callback(view);
		});
	}

	getRecordViewName() {
		let viewName = this.getMetadata().get(['clientDefs', this.scope, 'recordViews', this.viewMode]);

		if (viewName) {
			return viewName;
		}

		if (this.viewMode === this.MODE_LIST) {
			return this.recordView;
		}

		if (this.viewMode === this.MODE_KANBAN) {
			return this.recordKanbanView;
		}

		const propertyName = 'record' + Espo.Utils.upperCaseFirst(this.viewMode) + 'View';

		viewName = this[propertyName];

		if (!viewName) {
			throw new Error('No record view.');
		}

		return viewName;
	}

	setupModes() {
		super.setupModes();

		const allowUserKanban = this.getMetadata().get(
			['clientDefs', this.collection.name, 'userKanbanViewMode'],
			false,
		);

		const allowPartitioned = this.getMetadata().get(
			['clientDefs', this.collection.name, 'partitionedViewMode'],
			false,
		);

		const allowGrid = this.getMetadata().get(['clientDefs', this.collection.name, 'gridViewMode'], false);

		if (allowUserKanban) {
			this.viewModeList.push('userKanban');
		}

		if (allowPartitioned) {
			this.viewModeList.push('partitioned');
		}

		if (allowGrid) {
			this.viewModeList.push('grid');
		}

		if (this.viewModeList.length > 1) {
			const modeKey = 'listViewMode' + this.scope;

			if (this.getStorage().has('state', modeKey)) {
				const storedViewMode = this.getStorage().get('state', modeKey);

				if (storedViewMode === 'partitioned' && allowPartitioned) {
					this.viewMode = 'partitioned';
				} else if (storedViewMode === 'grid' && allowGrid) {
					this.viewMode = 'grid';
				} else if (storedViewMode === 'userKanban' && allowUserKanban) {
					this.viewMode = 'userKanban';
				}
			}
		}
	}

	setViewModePartitioned() {
		const by = this.partitionedViewHelper.getActiveOption();

		this.collection.maxSize = this.getConfig().get('recordsPerPageSmall');
		this.collection.url = this.collection.name + '/partition/' + by;
		this.collection.partitionBy = by;
	}

	setViewModeUserKanban() {
		this.collection.maxSize = this.getConfig().get('recordsPerPageSmall');
		this.collection.url = 'UserKanban/' + this.collection.name;
	}

	getSearchDefaultData() {
		const defaultSearchData = super.getSearchDefaultData() || {};

		const defaultAdvancedFilters =
				this.getMetadata().get(['clientDefs', this.scope, 'defaultAdvancedFilters']) || {};

		if (Object.keys(defaultAdvancedFilters).length) {
			defaultSearchData.advanced = defaultAdvancedFilters;
		}

		return defaultSearchData;
	}
});
