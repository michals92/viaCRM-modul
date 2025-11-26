import type RelatedListModalView from 'espocrm/src/views/modals/related-list';
import type SearchManager from 'espocrm/src/search-manager';
import type Collection from 'espocrm/src/collection';
import type Model from 'espocrm/src/model';
import type {VersionHelper as VersionHelperType} from 'viacrm:helpers/version';

interface AdvancedFilter {
	[key: string]: unknown;
}

interface FilterItem {
	name?: string;
}

interface SelectFilters {
	advanced?: Record<string, unknown>;
	bool?: string[];
	primary?: string;
}

interface ButtonItem {
	name: string;
	label: string;
	pullLeft?: boolean;
	onClick?: () => void;
}

interface RelatedListOptions {
	filters?: Record<string, AdvancedFilter>;
	primaryFilterName?: string;
	scope?: string;
	entityType?: string;
	defaultOrderBy?: string;
	defaultOrder?: string;
	panelName?: string;
	link?: string;
	defs?: {
		unlinkDisabled?: boolean;
		massUnlinkDisabled?: boolean;
		fullFormDisabled?: boolean;
	};
	filterList?: FilterItem[];
	filter?: string;
	layoutName?: string;
	url?: string;
	listViewName?: string;
	rowActionsView?: string;
	createDisabled?: boolean;
	selectDisabled?: boolean;
	massUnlinkDisabled?: boolean;
	massActionRemoveDisabled?: boolean;
	massActionMassUpdateDisabled?: boolean;
	panelCollection?: Collection;
	title?: string;
	listViewUrl?: string;
	fullFormUrl?: string;
	noDefaultFilters?: boolean;
	filtersDisabled?: boolean;
	filtersLayoutName?: string;
	boolFilterList?: string[];
	unlinkDisabled?: boolean;
}

define(
	['views/modals/related-list', 'viacrm:helpers/version'],
	(Dep: typeof RelatedListModalView, VersionHelper: typeof VersionHelperType) => class extends Dep {
		filters!: Record<string, AdvancedFilter>;
		declare primaryFilterName: string | null;
		declare buttonList: ButtonItem[];
		declare scope: string;
		declare defaultOrderBy: string;
		declare defaultOrder: string;
		declare panelName: string;
		declare link: string;
		declare defs: RelatedListOptions['defs'];
		declare filterList: FilterItem[];
		declare filter: string;
		declare layoutName: string;
		declare url: string;
		declare listViewName: string;
		declare rowActionsView: string;
		declare createDisabled: boolean;
		declare selectDisabled: boolean;
		declare massUnlinkDisabled: boolean;
		declare massActionRemoveDisabled: boolean;
		declare massActionMassUpdateDisabled: boolean;
		declare panelCollection: Collection | null;
		declare collection: Collection & {
			lastSyncPromise?: { getStatus(): number };
			parentModel?: Model;
		};
		declare model: Model;
		declare entityType: string;
		declare $header: JQuery;
		declare searchPanel: boolean;
		declare searchManager: SearchManager;
		declare noCreateScopeList: string[];
		declare unlinkDisabled: boolean;
		declare containerSelector: string;
		override options!: RelatedListOptions;

		override setup(): void {
			this.filters = (this.options.filters ?? {});
			this.primaryFilterName = this.options.primaryFilterName || null;

			this.buttonList = [
				{
					name: 'cancel',
					label: 'Close',
				},
			];

			this.scope = this.options.scope || this.options.entityType || this.scope;

			this.defaultOrderBy = this.options.defaultOrderBy!;
			this.defaultOrder = this.options.defaultOrder!;

			this.panelName = this.options.panelName!;
			this.link = this.options.link!;

			this.defs = this.options.defs || {};

			this.filterList = this.options.filterList!;
			this.filter = this.options.filter!;
			this.layoutName = this.options.layoutName || this.layoutName;
			this.url = this.options.url!;
			this.listViewName = this.options.listViewName!;
			this.rowActionsView = this.options.rowActionsView!;

			this.createDisabled = this.options.createDisabled || this.createDisabled;
			this.selectDisabled = this.options.selectDisabled || this.selectDisabled;

			this.massUnlinkDisabled = this.options.massUnlinkDisabled || this.massUnlinkDisabled;

			this.massActionRemoveDisabled = this.options.massActionRemoveDisabled || this.massActionRemoveDisabled;

			this.massActionMassUpdateDisabled =
				this.options.massActionMassUpdateDisabled || this.massActionMassUpdateDisabled;

			this.panelCollection = this.options.panelCollection || null;

			if (this.panelCollection) {
				this.listenTo(this.panelCollection, 'sync', (_c: unknown, _r: unknown, o: { skipCollectionSync?: boolean }) => {
					if (o.skipCollectionSync) {
						return;
					}

					this.collection.fetch();
				});

				// Sync changing models.
				this.listenTo(this.panelCollection, 'change', (m: Model, o: { xhr?: unknown }) => {
					// Prevent change after save.
					if (o.xhr || !m.id) {
						return;
					}

					const model = this.collection.get(m.id);

					if (!model) {
						return;
					}

					const attributes: Record<string, unknown> = {};

					for (const name in m.attributes) {
						if (m.hasChanged(name)) {
							attributes[name] = m.attributes[name];
						}
					}

					model.set(attributes);
				});

				if (this.model) {
					this.listenTo(this.model, 'after:unrelate', () => {
						this.panelCollection!.fetch({
							skipCollectionSync: true,
						} as Record<string, unknown>);
					});
				}
			} else if (this.model) {
				this.listenTo(this.model, 'after:relate', () => {
					this.collection.fetch();
				});
			}

			if (this.noCreateScopeList.indexOf(this.scope) !== -1) {
				this.createDisabled = true;
			}

			this.primaryFilterName = this.filter;

			if (!this.createDisabled) {
				if (
					!this.getAcl().check(this.scope, 'create') ||
					this.getMetadata().get(['clientDefs', this.scope, 'createDisabled'])
				) {
					this.createDisabled = true;
				}
			}

			this.unlinkDisabled = this.unlinkDisabled || this.options.unlinkDisabled || this.defs?.unlinkDisabled || false;

			if (!this.massUnlinkDisabled) {
				if (this.unlinkDisabled || this.defs?.massUnlinkDisabled || this.defs?.unlinkDisabled) {
					this.massUnlinkDisabled = true;
				}

				if (!this.getAcl().check(this.model, 'edit')) {
					this.massUnlinkDisabled = true;
				}
			}

			if (!this.selectDisabled) {
				this.buttonList.unshift({
					name: 'selectRelated',
					label: 'Select',
					pullLeft: true,
				});
			}

			if (!this.createDisabled) {
				this.buttonList.unshift({
					name: 'createRelated',
					label: 'Create',
					pullLeft: true,
				});
			}

			this.$header = $('<span>');

			if (this.model) {
				if (this.model.get('name')) {
					this.$header.append(
						$('<span>').text(this.model.get('name') as string),
						' <span class="chevron-right"></span> ',
					);
				}
			}

			let title = this.options.title;

			if (title) {
				title = this.getHelper()
					.escapeString(this.options.title!)
					.replace(/@right/, '<span class="chevron-right"></span>');
			}

			this.$header.append(
				title || $('<span>').text(this.getLanguage().translate(this.link, 'links', this.entityType)),
			);

			if (this.options.listViewUrl) {
				this.$header = $('<a>').attr('href', this.options.listViewUrl).append(this.$header);
			}

			if (
				!this.options.listViewUrl &&
				((!this.defs?.fullFormDisabled && this.link && this.model.hasLink(this.link)) ||
					this.options.fullFormUrl)
			) {
				const url =
					this.options.fullFormUrl ||
					'#' + this.model.entityType + '/related/' + this.model.id + '/' + this.link;

				this.buttonList.unshift({
					name: 'fullForm',
					label: 'Full Form',
					onClick: () => this.getRouter().navigate(url, {trigger: true}),
				});

				this.$header = $('<a>').attr('href', url).append(this.$header);
			}

			const iconHtml = this.getHelper().getScopeColorIconHtml(this.scope);

			if (iconHtml) {
				this.$header = $('<span>').append(iconHtml).append(this.$header);
			}

			this.waitForView('list');

			if (this.searchPanel) {
				this.waitForView('search');
			}

			this.getCollectionFactory().create(this.scope, (collection: Collection & { parentModel?: Model }) => {
				collection.maxSize = this.getConfig().get('recordsPerPage') as number;
				collection.url = this.url;

				collection.setOrder(this.defaultOrderBy, this.defaultOrder, true);
				collection.parentModel = this.model;

				this.collection = collection;

				if (this.panelCollection) {
					this.listenTo(collection, 'change', (model: Model) => {
						const panelModel = this.panelCollection!.get(model.id!);

						if (panelModel) {
							panelModel.set(model.attributes);
						}
					});

					this.listenTo(collection, 'after:mass-remove', () => {
						this.panelCollection!.fetch({
							skipCollectionSync: true,
						} as Record<string, unknown>);
					});
				}

				this.setupSearch();
				this.setupList();
			});

			// If the list not yet loaded.
			this.once('close', () => {
				if (this.collection.lastSyncPromise && this.collection.lastSyncPromise.getStatus() < 4) {
					Espo.Ui.notify(false);
				}

				this.collection.abortLastFetch();
			});
		}

		override setupSearch(): void {
			const searchManager: SearchManager = (this.searchManager = new VersionHelper(this.getConfig()).createSearchManager(
				this.collection,
				'listSelect',
				this.getStorage(),
				this.getDateTime(),
			));

			// @ts-expect-error private property
			searchManager.emptyOnReset = true;

			if (this.filters) {
				searchManager.setAdvanced(this.filters);
			}

			const primaryFilterName = this.primaryFilterName;

			if (primaryFilterName) {
				searchManager.setPrimary(primaryFilterName);
			}

			this.collection.where = searchManager.getWhere();

			let filterList: FilterItem[] = Espo.Utils.clone(this.getMetadata().get(['clientDefs', this.scope, 'filterList']) || []);

			if (this.options.noDefaultFilters) {
				filterList = [];
			}

			if (this.filterList) {
				this.filterList.forEach((item1: FilterItem | string) => {
					let isFound = false;

					const name1 = typeof item1 === 'string' ? item1 : item1.name;

					if (!name1 || name1 === 'all') {
						return;
					}

					filterList.forEach((item2: FilterItem | string) => {
						const name2 = typeof item2 === 'string' ? item2 : item2.name;

						if (name1 === name2) {
							isFound = true;
						}
					});

					if (!isFound) {
						filterList.push(item1 as FilterItem);
					}
				});
			}

			if (this.options.filtersDisabled) {
				filterList = [];
			}

			if (this.searchPanel) {
				this.createView(
					'search',
					'views/record/search',
					{
						collection: this.collection,
						fullSelector: this.containerSelector + ' .search-container',
						searchManager: searchManager,
						disableSavePreset: true,
						filterList: filterList,
						filtersLayoutName: this.options.filtersLayoutName,
					},
					(view: { render(): void }) => {
						this.listenTo(view, 'reset', () => {});
					},
				);
			}
		}

		// @ts-expect-error override
		actionSelectRelated(): void {
			const viewName =
				this.getMetadata().get(['clientDefs', this.scope, 'modalViews', 'select']) ||
				'views/modals/select-records';

			const handler = this.getMetadata().get([
				'clientDefs',
				this.model.entityType,
				'relationshipPanels',
				this.link,
				'selectHandler',
			]) as string | null;

			new Promise<SelectFilters>(resolve => {
				if (!handler) {
					resolve({});
					return;
				}

				Espo.loader
					.requirePromise(handler)
					.then((Handler: new (helper: unknown) => { getFilters(model: Model): Promise<SelectFilters> }) => new Handler(this.getHelper()))
					.then((handlerInstance: { getFilters(model: Model): Promise<SelectFilters> }) => {
						handlerInstance.getFilters(this.model).then((filters: SelectFilters) => resolve(filters));
					});
			}).then((filters: SelectFilters) => {
				const advanced = {...(this.options.filters || {}), ...(filters.advanced || {})};
				let boolFilterList = this.options.boolFilterList || [];

				if (filters.bool) {
					boolFilterList = [...boolFilterList, ...filters.bool];
				}

				const primaryFilterName = filters.primary || this.options.primaryFilterName;

				this.createView(
					'dialog',
					viewName as string,
					{
						scope: this.scope,
						multiple: true,
						createButton: false,
						filters: advanced,
						boolFilterList: boolFilterList,
						primaryFilterName: primaryFilterName,
						filterList: this.getSelectFilterList(),
						layoutName: this.layoutName,
					},
					(dialog: { render(): void }) => {
						dialog.render();

						this.listenToOnce(dialog, 'select', (models: Model | Model[]) => {
							this.clearView('dialog');
							if (!Array.isArray(models)) {
								models = [models];
							}

							const ids = models.map((model: Model) => model.id!);

							this.linkMultipleRecords(ids);
						});
					},
				);
			});
		}

		linkMultipleRecords(ids: string[]): void {
			Espo.Ajax.postRequest(`${this.model.entityType}/${this.model.id}/${this.link}`, {
				ids: ids,
			}).then(() => {
				this.collection.fetch();
				this.model.trigger('after:relate');
				this.model.trigger(`after:relate:${this.link}`);
			});
		}
	},
);
