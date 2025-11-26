import type {AggregationHelper as AggregationHelperType} from 'viacrm:helpers/aggregation';
import type {PartitionedViewHelper as PartitionedViewHelperType} from 'viacrm:helpers/partitioned-view';
import type {AggregationModel as AggregationModelType} from 'viacrm:models/aggregation';
import type {Autocomplete as AutocompleteType} from 'ui/autocomplete';
import type Collection from 'espocrm/src/collection';
import type Model from 'espocrm/src/model';

import type SearchView from 'espocrm/src/views/record/search';
import type { BaseFieldData } from 'viacrm/types';

type AggregationDef = {
	field: string;
	function: string;
	params?: Record<string, unknown>;
};

type AggregationFunctions = Record<string, AggregationDef>;

type FunctionView = {
	$el: JQuery;
	once(event: string, callback: () => void): void;
	render(): void;
};

type StoredTextSearchHelper = {
	match(query: string, limit: number): string[];
	remove(text: string): void;
};

extend<SearchView>(
	[
		'viacrm:helpers/aggregation',
		'viacrm:helpers/partitioned-view',
		'viacrm:models/aggregation',
		'ui/autocomplete',
	],
	(Dep, AggregationHelper: typeof AggregationHelperType, PartitionedViewHelper: typeof PartitionedViewHelperType, AggregationModel: typeof AggregationModelType, Autocomplete: typeof AutocompleteType) => class extends Dep {
		template = 'viacrm:record/search';

		selectedCustomFilter: string | null = null;
		filterHeaderLabel: string | null = null;
		listHeaderLabel: string | null = null;

		aggregationHelper!: AggregationHelperType;
		partitionedViewHelper!: PartitionedViewHelperType;
		aggregationDefs!: AggregationDef[];
		aggregations!: AggregationFunctions;
		aggregationModel!: AggregationModelType;
		collection!: Collection;
		scope!: string;
		entityType!: string;
		model!: Model;
		searchManager!: { type: string };
		_helper!: { layoutManager: unknown };
		advanced!: Record<string, unknown>;
		$textFilter!: JQuery;
		textSearchStoringDisabled!: boolean;
		storedTextSearchHelper!: StoredTextSearchHelper;
		autocompleteLimit!: number;
		viewMode!: string;
		viewModeIconClassMap!: Record<string, string>;
		events!: Record<string, (e: JQuery.TriggeredEvent) => void>;
		$aggregationFunctionPanel!: JQuery;

		initTextSearchAutocomplete(): void {
			if (this.textSearchStoringDisabled) {
				return;
			}

			const autocomplete = new Autocomplete(this.$textFilter.get(0) as HTMLInputElement, {
				triggerSelectOnValidInput: false,
				focusOnSelect: true,
				onSelect: () => {
					setTimeout(() => autocomplete.hide(), 1);
					this.search();
				},
				lookupFunction: (query: string) => Promise.resolve(
					this.storedTextSearchHelper
						.match(query, this.autocompleteLimit)
						.map((item: string) => ({ value: item })),
				),
				formatResult: (item: { value: string }) => $('<span>')
					.append(
						$('<a>')
							.attr('data-action', 'clearStoredTextSearch')
							.attr('role', 'button')
							.attr('data-value', item.value)
							.attr('title', this.translate('Remove') as string)
							.html('<span class="fas fa-times fa-sm"></span>')
							.addClass('pull-right text-soft'),
						$('<span>').text(item.value),
					)
					.get(0)!.innerHTML,
				beforeRender: (container: HTMLElement) => {
					const $container = $(container);
					$container.addClass('text-search-suggestions');

					$container.find('a[data-action="clearStoredTextSearch"]').on('click', (e: JQuery.ClickEvent) => {
						e.stopPropagation();
						e.preventDefault();

						const text = (e.currentTarget as HTMLElement).getAttribute('data-value');
						this.storedTextSearchHelper.remove(text!);

						autocomplete.hide();
						// 200 is hardcoded in autocomplete lib.
						setTimeout(() => this.$textFilter.focus(), 201);
					});
				},
			});

			this.once('render remove', () => autocomplete.dispose());
		}

		setup(): void {
			this.setupEvents();
			this.setupViewModes();

			super.setup();

			this.aggregationHelper = new AggregationHelper(
				this.searchManager.type,
				this.model,
				this.getStorage(),
				this.getMetadata(),
				this._helper.layoutManager,
				this.getFieldManager(),
				this.getStorage(),
			);
			this.partitionedViewHelper = new PartitionedViewHelper(
				this.model,
				this.getStorage(),
				this.getFieldManager(),
				this.getMetadata(),
			);

			this.wait(this.aggregationHelper.getAggregationDefs().then((defs: AggregationDef[]) => (this.aggregationDefs = defs)));

			this.aggregations = this.aggregationHelper.getActiveAggregationFunctions();
			this.aggregationModel = new AggregationModel();
			this.aggregationModel.setAggregationData(this.aggregations);
			this.aggregationModel.setSearchManager(this.searchManager);
			this.aggregationModel.setScope(this.scope);

			this.listenTo(this.collection, 'sync', () => {
				this.aggregationModel.fetch();
			});

			this.on('change-view-mode', this.controlPartitionVisibility, this);

			this.createFunctions();
		}

		setupEvents(): void {
			this.events['change select[data-name="partitionBy"]'] = (e: JQuery.TriggeredEvent) => {
				const by = (e.target as HTMLSelectElement).value;

				this.partitionedViewHelper.saveActiveOption(by);
				this.loadPartition(by);
			};

			this.events['click a[data-action="addFunction"]'] = (e: JQuery.TriggeredEvent) => {
				const $target = $(e.currentTarget as HTMLElement);
				const field = $target.data('field') as string;
				const func = $target.data('function') as string;

				$target.closest('li').addClass('hidden');

				this.addFunction(field, func);
			};

			this.events['click .aggregation-function-panel a.remove-function'] = (e: JQuery.TriggeredEvent) => {
				const $target = $(e.currentTarget as HTMLElement);
				const name = $target.data('name') as string;

				this.removeFunction(name);
			};

			this.events['click [data-action="selectPreset"]'] = (e: JQuery.TriggeredEvent) => {
				const name = $(e.currentTarget as HTMLElement).data('name') as string;

				if (name) {
					this.selectedCustomFilter = name;
					this.selectPreset(name);
				}
			};

			this.events['click a[data-action="removePreset"]'] = (e: JQuery.TriggeredEvent) => {
				const name = $(e.currentTarget as HTMLElement).data('name') as string;

				this.confirm(this.translate('confirmation', 'messages') as string, () => {
					this.removePreset(name);
				});
			};
		}

		loadSearchData(): void {
			super.loadSearchData();

			const defaultAdvancedFilters =
					(this.getMetadata().get(['clientDefs', this.entityType, 'defaultAdvancedFilters']) as Record<string, unknown>) || {};

			if (defaultAdvancedFilters && typeof defaultAdvancedFilters === 'object') {
				this.advanced = { ...defaultAdvancedFilters, ...this.advanced };
			}
		}

		selectPreset(presetName: string, forceClearAdvancedFilters?: boolean): void {
			const customFilters = (this.getPreferences().get('presetFilters') as Record<string, Array<{ name: string }>>) ?? {};

			const isCustom = (customFilters[this.scope] || []).some((filter: { name: string }) => filter.name === presetName);

			if (!isCustom) {
				this.selectedCustomFilter = null;
			}

			super.selectPreset(presetName, forceClearAdvancedFilters);
		}

		setupViewModes(): void {
			this.viewModeIconClassMap.partitioned = 'fas fa-solid fa-layer-group';
			this.viewModeIconClassMap.grid = 'fas fa-solid fa-th-large';
			this.viewModeIconClassMap.userKanban = 'fas fa-solid fa-users';
		}

		addFunction(field: string, func: string): void {
			const name = field + '_' + func;

			this.aggregations[name] = {
				field: field,
				function: func,
				params: {},
			};

			this.saveAggregationFunctions();
			this.createFunction(name, field, func, () => {
				this.aggregationModel.fetch();
			});

			this.updateAddFunctionButton();
		}

		removeFunction(name: string): void {
			this.$el.find('ul.function-list li[data-name="' + name + '"]').removeClass('hidden');

			const container = (this.getView('function-' + name) as FunctionView).$el.closest('div.function');

			this.clearView('function-' + name);

			container.remove();

			delete this.aggregations[name];
			this.saveAggregationFunctions();

			this.updateAddFunctionButton();
		}

		saveAggregationFunctions(): void {
			this.aggregationHelper.save(this.aggregations);
		}

		getCustomFilterList(): Array<{ name: string }> | undefined {
			return ((this.getPreferences().get('presetFilters') as Record<string, Array<{ name: string }>>) ?? {})[this.scope];
		}

		data(): BaseFieldData {
			return {
				...super.data(),
				filterHeaderLabel: this.getMetadata().get(['clientDefs', this.entityType || this.scope, 'filterHeaderLabel']),
				listHeaderLabel: this.getMetadata().get(['clientDefs', this.entityType || this.scope, 'listHeaderLabel']),
				customFilterList: this.getCustomFilterList(),
				customFiltersAboveList: (this.getPreferences().get('customFiltersAboveList') as boolean) ?? false,
				aggregationFunctions: this.getAggregationDefs(),
				emptyAggregationFunctions: this.aggregationDefs.length === 0,
				functionDataList: this.getFunctionDataList(),
				partitionOptions: this.partitionedViewHelper.getOptions(),
				selectedPartition: this.partitionedViewHelper.getActiveOption(),
			};
		}

		getAggregationDefs(): Array<{ field: string; function: string; checked: boolean; name: string }> {
			return this.aggregationDefs.map((def: AggregationDef) => {
				const name = def.field + '_' + def.function;

				return {
					field: def.field,
					function: def.function,
					checked: name in this.aggregations,
					name: name,
				};
			});
		}

		getFunctionDataList(): Array<{ key: string; name: string }> {
			const data: Array<{ key: string; name: string }> = [];

			Object.keys(this.aggregations).forEach((key: string) => {
				data.push({
					key: 'function-' + key,
					name: key,
				});
			});

			return data;
		}

		createFunction(name: string, field: string, func: string, callback?: (view: FunctionView) => void): void {
			const rendered = this.isRendered();

			if (rendered) {
				this.$aggregationFunctionPanel.append(
					'<div class="function function-' + name + '" data-name="' + name + '"/>',
				);
			}

			this.createView(
				'function-' + name,
				'viacrm:views/search/aggregation-function',
				{
					el: this.options.el + ' .function[data-name="' + name + '"]',
					name: name,
					model: this.aggregationModel,
					entityType: this.entityType,
					field: field,
					function: func,
					aggregationHelper: this.aggregationHelper,
				},
				(view: FunctionView) => {
					if (typeof callback === 'function') {
						view.once('after:render', () => callback(view));
					}

					if (rendered) {
						view.render();
					}
				},
			);
		}

		createFunctions(callback?: () => void): void {
			let i = 0;
			const count = Object.keys(this.aggregations).length;

			if (count === 0) {
				if (typeof callback === 'function') {
					callback();
				}
				return;
			}

			Object.entries(this.aggregations).forEach(([name, aggregation]: [string, AggregationDef]) => {
				this.createFunction(name, aggregation.field, aggregation.function, () => {
					i++;

					if (i === count && typeof callback === 'function') {
						callback();
					}
				});
			});
		}

		loadPartition(by: string): void {
			this.collection.reset();

			(this.collection as Collection & { url: string; partitionBy: string }).url = this.collection.name + '/partition/' + by;
			(this.collection as Collection & { partitionBy: string }).partitionBy = by;

			Espo.Ui.notifyWait();

			this.collection.fetch().then(() => Espo.Ui.notify(false));
		}

		afterRender(): void {
			super.afterRender();

			this.$aggregationFunctionPanel = this.$el.find('.aggregation-function-panel');

			this.updateAddFunctionButton();
			this.controlPartitionVisibility(this.viewMode);

			const name = this.selectedCustomFilter;

			if (name) {
				this.$el.find(`.custom-filter-controls [data-name=${name}]`).addClass('active');
			}
		}

		controlPartitionVisibility(viewMode: string): void {
			if (viewMode === 'partitioned') {
				this.$el.find('div.partition-container').removeClass('hidden');
			} else {
				this.$el.find('div.partition-container').addClass('hidden');
			}
		}

		updateAddFunctionButton(): void {
			const $ul = this.$el.find('ul.function-list');

			if ($ul.children().not('.hidden').not('.dropdown-header').length === 0) {
				this.$el.find('button.add-function-button').addClass('disabled');
			} else {
				this.$el.find('button.add-function-button').removeClass('disabled');
			}
		}
	},
);
