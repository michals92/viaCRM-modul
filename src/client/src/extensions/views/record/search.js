extend(
	[
		'viacrm:helpers/aggregation',
		'viacrm:helpers/partitioned-view',
		'viacrm:models/aggregation',
		'ui/autocomplete',
	],
	(Dep, AggregationHelper, PartitionedViewHelper, AggregationModel, Autocomplete) => class extends Dep {
		template = 'viacrm:record/search';

		selectedCustomFilter = null;
		filterHeaderLabel = null;
		listHeaderLabel = null;

		initTextSearchAutocomplete() {
			if (this.textSearchStoringDisabled) {
				return;
			}

			const autocomplete = new Autocomplete(this.$textFilter.get(0), {
				triggerSelectOnValidInput: false,
				focusOnSelect: true,
				onSelect: () => {
					setTimeout(() => autocomplete.hide(), 1);
					this.search();
				},
				lookupFunction: query => Promise.resolve(
					this.storedTextSearchHelper
						.match(query, this.autocompleteLimit)
						.map(item => ({ value: item })),
				),
				formatResult: item => $('<span>')
					.append(
						$('<a>')
							.attr('data-action', 'clearStoredTextSearch')
							.attr('role', 'button')
							.attr('data-value', item.value)
							.attr('title', this.translate('Remove'))
							.html('<span class="fas fa-times fa-sm"></span>')
							.addClass('pull-right text-soft'),
						$('<span>').text(item.value),
					)
					.get(0).innerHTML,
				beforeRender: container => {
					const $container = $(container);
					$container.addClass('text-search-suggestions');

					$container.find('a[data-action="clearStoredTextSearch"]').on('click', e => {
						e.stopPropagation();
						e.preventDefault();

						const text = e.currentTarget.getAttribute('data-value');
						this.storedTextSearchHelper.remove(text);

						autocomplete.hide();
						// 200 is hardcoded in autocomplete lib.
						setTimeout(() => this.$textFilter.focus(), 201);
					});
				},
			});

			this.once('render remove', () => autocomplete.dispose());
		}

		setup() {
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

			this.wait(this.aggregationHelper.getAggregationDefs().then(defs => (this.aggregationDefs = defs)));

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

		setupEvents() {
			this.events['change select[data-name="partitionBy"]'] = e => {
				const by = e.target.value;

				this.partitionedViewHelper.saveActiveOption(by);
				this.loadPartition(by);
			};

			this.events['click a[data-action="addFunction"]'] = e => {
				const $target = $(e.currentTarget);
				const field = $target.data('field');
				const func = $target.data('function');

				$target.closest('li').addClass('hidden');

				this.addFunction(field, func);
			};

			this.events['click .aggregation-function-panel a.remove-function'] = e => {
				const $target = $(e.currentTarget);
				const name = $target.data('name');

				this.removeFunction(name);
			};

			this.events['click [data-action="selectPreset"]'] = e => {
				const name = $(e.currentTarget).data('name');

				if (name) {
					this.selectedCustomFilter = name;
					this.selectPreset(name);
				}
			};

			this.events['click a[data-action="removePreset"]'] = e => {
				const name = $(e.currentTarget).data('name');

				this.confirm(this.translate('confirmation', 'messages'), () => {
					this.removePreset(name);
				});
			};
		}

		loadSearchData() {
			super.loadSearchData();

			const defaultAdvancedFilters =
					this.getMetadata().get(['clientDefs', this.entityType, 'defaultAdvancedFilters']) || {};

			if (defaultAdvancedFilters && typeof defaultAdvancedFilters === 'object') {
				this.advanced = { ...defaultAdvancedFilters, ...this.advanced };
			}
		}

		selectPreset(presetName, forceClearAdvancedFilters) {
			const customFilters = this.getPreferences().get('presetFilters') ?? {};

			const isCustom = (customFilters[this.scope] || []).some(filter => filter.name === presetName);

			if (!isCustom) {
				this.selectedCustomFilter = null;
			}

			super.selectPreset(presetName, forceClearAdvancedFilters);
		}

		setupViewModes() {
			this.viewModeIconClassMap.partitioned = 'fas fa-solid fa-layer-group';
			this.viewModeIconClassMap.grid = 'fas fa-solid fa-th-large';
			this.viewModeIconClassMap.userKanban = 'fas fa-solid fa-users';
		}

		addFunction(field, func) {
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

		removeFunction(name) {
			this.$el.find('ul.function-list li[data-name="' + name + '"]').removeClass('hidden');

			const container = this.getView('function-' + name).$el.closest('div.function');

			this.clearView('function-' + name);

			container.remove();

			delete this.aggregations[name];
			this.saveAggregationFunctions();

			this.updateAddFunctionButton();
		}

		saveAggregationFunctions() {
			this.aggregationHelper.save(this.aggregations);
		}

		getCustomFilterList() {
			return (this.getPreferences().get('presetFilters') ?? {})[this.scope];
		}

		data() {
			return {
				...super.data(),
				filterHeaderLabel: this.getMetadata().get(['clientDefs', this.entityType || this.scope, 'filterHeaderLabel']),
				listHeaderLabel: this.getMetadata().get(['clientDefs', this.entityType || this.scope, 'listHeaderLabel']),
				customFilterList: this.getCustomFilterList(),
				customFiltersAboveList: this.getPreferences().get('customFiltersAboveList') ?? false,
				aggregationFunctions: this.getAggregationDefs(),
				emptyAggregationFunctions: this.aggregationDefs.length === 0,
				functionDataList: this.getFunctionDataList(),
				partitionOptions: this.partitionedViewHelper.getOptions(),
				selectedPartition: this.partitionedViewHelper.getActiveOption(),
			};
		}

		getAggregationDefs() {
			return this.aggregationDefs.map(def => {
				const name = def.field + '_' + def.function;

				return {
					field: def.field,
					function: def.function,
					checked: name in this.aggregations,
					name: name,
				};
			});
		}

		getFunctionDataList() {
			const data = [];

			Object.keys(this.aggregations).forEach(key => {
				data.push({
					key: 'function-' + key,
					name: key,
				});
			});

			return data;
		}

		createFunction(name, field, func, callback) {
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
				view => {
					if (typeof callback === 'function') {
						view.once('after:render', () => callback(view));
					}

					if (rendered) {
						view.render();
					}
				},
			);
		}

		createFunctions(callback) {
			let i = 0;
			const count = Object.keys(this.aggregations).length;

			if (count === 0) {
				if (typeof callback === 'function') {
					callback();
				}
				return;
			}

			Object.entries(this.aggregations).forEach(([name, aggregation]) => {
				this.createFunction(name, aggregation.field, aggregation.function, () => {
					i++;

					if (i === count && typeof callback === 'function') {
						callback();
					}
				});
			});
		}

		loadPartition(by) {
			this.collection.reset();

			this.collection.url = this.collection.name + '/partition/' + by;
			this.collection.partitionBy = by;

			Espo.Ui.notifyWait();

			this.collection.fetch().then(() => Espo.Ui.notify(false));
		}

		afterRender() {
			super.afterRender();

			this.$aggregationFunctionPanel = this.$el.find('.aggregation-function-panel');

			this.updateAddFunctionButton();
			this.controlPartitionVisibility(this.viewMode);

			const name = this.selectedCustomFilter;

			if (name) {
				this.$el.find(`.custom-filter-controls [data-name=${name}]`).addClass('active');
			}
		}

		controlPartitionVisibility(viewMode) {
			if (viewMode === 'partitioned') {
				this.$el.find('div.partition-container').removeClass('hidden');
			} else {
				this.$el.find('div.partition-container').addClass('hidden');
			}
		}

		updateAddFunctionButton() {
			let $ul = this.$el.find('ul.function-list');

			if ($ul.children().not('.hidden').not('.dropdown-header').length === 0) {
				this.$el.find('button.add-function-button').addClass('disabled');
			} else {
				this.$el.find('button.add-function-button').removeClass('disabled');
			}
		}
	},
);
