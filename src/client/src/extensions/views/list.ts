import type ListView from 'espocrm/src/views/list';

type PartitionedViewHelper = {
	getActiveOption(): string;
};

type PartitionedViewHelperConstructor = new (
	scope: string,
	storage: unknown,
	fieldManager: unknown,
	metadata: unknown
) => PartitionedViewHelper;

type ColorizeHelper = {
	applyColorsToRows(view: unknown, collection: unknown, entityType: string): void;
	applyColorToRow(view: unknown, color: string | null, id: string): void;
	getColor(model: unknown, entityType: string, view: unknown): string | null;
};

type ColorizeHelperConstructor = new (
	metadata: unknown,
	user: unknown
) => ColorizeHelper;

type SearchData = {
	advanced?: Record<string, unknown>;
	[key: string]: unknown;
};

extend<ListView>(
	['viacrm:helpers/partitioned-view', 'viacrm:helpers/colorize'],
	(Dep, PartitionedViewHelper: PartitionedViewHelperConstructor, ColorizeHelper: ColorizeHelperConstructor) => class extends Dep {
		recordPartitionedView: string = 'viacrm:views/record/partitioned';
		recordGridView: string = 'viacrm:views/record/grid';
		recordUserKanbanView: string = 'viacrm:views/record/user-kanban';

		MODE_GRID: string = 'grid';
		MODE_USER_KANBAN: string = 'userKanban';

		partitionedViewHelper!: PartitionedViewHelper;
		colorizeHelper!: ColorizeHelper;

		init(): void {
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

		afterRender(): void {
			if (super.afterRender) {
				super.afterRender();
			}
			this.colorizeHelper.applyColorsToRows(this, this.collection, this.entityType || this.scope);
		}

		/**
		 * Override buildRow to apply colors when rows are created
		 */
		buildRow(i: number, model: { id: string }, callback?: (view: unknown) => void): void {
			const entityType = this.entityType || this.scope;

			const color = this.colorizeHelper.getColor(model, entityType, this);

			super.buildRow(i, model, (view: unknown) => {
				// Apply color to the row view after it's created
				this.colorizeHelper.applyColorToRow(view, color, model.id);

				if (callback) callback(view);
			});
		}

		getRecordViewName(): string {
			let viewName = this.getMetadata().get(['clientDefs', this.scope, 'recordViews', this.viewMode]) as string | null;

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

			viewName = this[propertyName] as string;

			if (!viewName) {
				throw new Error('No record view.');
			}

			return viewName;
		}

		setupModes(): void {
			super.setupModes();

			const allowUserKanban = this.getMetadata().get(
				['clientDefs', this.collection.name, 'userKanbanViewMode'],
				false,
			) as boolean;

			const allowPartitioned = this.getMetadata().get(
				['clientDefs', this.collection.name, 'partitionedViewMode'],
				false,
			) as boolean;

			const allowGrid = this.getMetadata().get(
				['clientDefs', this.collection.name, 'gridViewMode'],
				false,
			) as boolean;

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
					const storedViewMode = this.getStorage().get('state', modeKey) as string;

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

		setViewModePartitioned(): void {
			const by = this.partitionedViewHelper.getActiveOption();

			this.collection.maxSize = this.getConfig().get('recordsPerPageSmall');
			this.collection.url = this.collection.name + '/partition/' + by;
			this.collection.partitionBy = by;
		}

		setViewModeUserKanban(): void {
			this.collection.maxSize = this.getConfig().get('recordsPerPageSmall');
			this.collection.url = 'UserKanban/' + this.collection.name;
		}

		getSearchDefaultData(): SearchData {
			const defaultSearchData: SearchData = super.getSearchDefaultData() || {};

			const defaultAdvancedFilters =
				this.getMetadata().get(['clientDefs', this.scope, 'defaultAdvancedFilters']) as Record<string, unknown> || {};

			if (Object.keys(defaultAdvancedFilters).length) {
				defaultSearchData.advanced = defaultAdvancedFilters;
			}

			return defaultSearchData;
		}
	}
);
