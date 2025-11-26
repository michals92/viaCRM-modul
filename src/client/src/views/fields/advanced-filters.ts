import type BaseFieldView from 'espocrm/src/views/fields/base';
import type Model from 'espocrm/src/model';
import type { AdvancedFiltersFieldData } from 'viacrm/types';

interface FilterInfo {
	name: string;
	selected: boolean;
}

interface FilterViewInfo {
	key: string;
	name: string;
}

interface FilterView {
	render(): void;
	getView(name: string): { fetchSearch(): Record<string, unknown> };
}

define(
	['views/fields/base'],
	(Dep) => {
		const Base = Dep as typeof BaseFieldView;

		// @ts-expect-error - Property shadowing causes type incompatibility
		return class extends Base {
			override editTemplate = 'viacrm:fields/advanced-filters/edit';

			advancedFilters: Record<string, FilterInfo> = {};

			filterViewsMap: Record<string, FilterViewInfo> = {};

			seed: Model | null = null;

			// @ts-expect-error - Shadowing private base class property with public property
			entityType: string | null = null;

			override events: Record<string, (e: JQuery.ClickEvent) => void> = {
				'click a[data-action="addFilter"]': (e: JQuery.ClickEvent) => {
					const $target = $(e.currentTarget);
					const name = $target.data('name') as string;

					this.addFilter(name);
				},
				'click .advanced-filters a.remove-filter': (e: JQuery.ClickEvent) => {
					const $target = $(e.currentTarget);
					const name = $target.data('name') as string;

					this.removeFilter(name);
				},
			};

			override setup(): void {
				this.entityType = this.options.entityType || (this.params as any).entityType || this.entityType;

				super.setup();

				if (this.entityType) {
					this.wait(this.loadFilters());
				}
			}

			loadFilters(): Promise<void[]> {
				this.advancedFilters = {};
				this.filterViewsMap = {};

				return Promise.all([
					this.getAvailableFilters(),
					this.setupSeedModel().then(() => this.createFilterViews(view => {
						if (this.isRendered()) {
							view.render();
						}
					})),
				]);
			}

			getAvailableFilters(): Promise<void> {
				const forbiddenFieldList = this.getAcl().getScopeForbiddenFieldList(this.entityType!) || [];
				const advancedFilters = (this.model.get(this.name) as Record<string, unknown>) || [];

				return new Promise(resolve => {
			
					(this.getHelper().layoutManager as any).get(this.entityType!, 'filters', (list: string[]) => {
						(list || []).forEach(field => {
							if (forbiddenFieldList.includes(field)) {
								return;
							}

							this.advancedFilters[field] = {
								name: field,
								selected: field in advancedFilters,
							};
						});

						for (const filter in this.advancedFilters) {
							if (!this.advancedFilters[filter]?.selected) {
								continue;
							}

							this.filterViewsMap[filter] = {
								key: 'filter-' + filter,
								name: filter,
							};
						}

						resolve();
					});
				});
			}

			setupSeedModel(): Promise<void> {
				return new Promise(resolve => {
					this.getModelFactory().create(this.entityType!, (model: Model) => {
						this.seed = model;

						resolve();
					});
				});
			}

			override data(): AdvancedFiltersFieldData {
				const data = super.data();

				data.entityType = this.entityType;
				data.filterList = Object.values(this.advancedFilters);
				data.filterDataList = Object.values(this.filterViewsMap);

				return data;
			}

			createFilterViews(callback?: (view: FilterView) => void): Promise<void> {
				const activeFilters = (this.model.get(this.name) as Record<string, Record<string, unknown>>) || {};
				const totalCount = Object.keys(activeFilters).length;
				let i = 0;

				return new Promise(resolve => {
					if (totalCount === 0) {
						resolve();
						return;
					}

					for (const filter in activeFilters) {
						this.createFilterView(filter, activeFilters[filter] ?? {}, view => {
							if (typeof callback === 'function') {
								callback(view);
							}

							if (++i === totalCount) {
								resolve();
							}
						});
					}
				});
			}

			createFilterView(name: string, params: Record<string, unknown>, callback?: (view: FilterView) => void): void {
				params = params || {};

				this.createView(
					'filter-' + name,
					'views/search/filter',
					{
						name: name,
						model: this.seed,
						params: params,
						el: this.options.el + ' .filter[data-name="' + name + '"]',
					},
					(view: FilterView) => {
						this.listenTo(view, 'change', () => {
							this.trigger('change');
						});

						if (typeof callback === 'function') {
							callback(view);
						}
					},
				);
			}

			addFilter(name: string): void {
				if (!this.advancedFilters[name]) {
					return;
				}

				this.advancedFilters[name].selected = true;
				this.filterViewsMap[name] = {
					key: 'filter-' + name,
					name: name,
				};

				this.createFilterView(name, {}, () => {
					this.reRender();
				});

				this.trigger('change');
			}

			removeFilter(name: string): void {
				if (!this.advancedFilters[name]) {
					return;
				}

				this.advancedFilters[name].selected = false;
				delete this.filterViewsMap[name];

				this.reRender();

				this.trigger('change');
			}

			override fetch(): Record<string, Record<string, unknown> | null> {
				const filterData: Record<string, unknown> = {};

				for (const filter in this.advancedFilters) {
					const view = this.getView('filter-' + filter) as FilterView | undefined;

					if (!this.advancedFilters[filter]?.selected) {
						continue;
					}

					let value: Record<string, unknown> = {};

					if (view) {
						value = view.getView('field').fetchSearch();
					}

					filterData[filter] = value;
				}

				const data: Record<string, Record<string, unknown> | null> = {};

				if (Object.keys(filterData).length > 0) {
					data[this.name] = filterData;
				} else {
					data[this.name] = null;
				}

				return data;
			}
		};
	},
);
