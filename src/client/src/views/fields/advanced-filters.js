define(['views/fields/base'], Dep => class extends Dep {
	editTemplate = 'autocrm:fields/advanced-filters/edit';

	advancedFilters = {};

	filterViewsMap = {};

	seed = null;

	entityType = null;

	events = {
		'click a[data-action="addFilter"]': e => {
			const $target = $(e.currentTarget);
			const name = $target.data('name');

			this.addFilter(name);
		},
		'click .advanced-filters a.remove-filter': e => {
			const $target = $(e.currentTarget);
			const name = $target.data('name');

			this.removeFilter(name);
		},
	};

	setup() {
		this.entityType = this.options.entityType || this.params.entityType || this.entityType;

		super.setup();

		if (this.entityType) {
			this.wait(this.loadFilters());
		}
	}

	loadFilters() {
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

	getAvailableFilters() {
		const forbiddenFieldList = this.getAcl().getScopeForbiddenFieldList(this.entityType) || [];
		const advancedFilters = this.model.get(this.name) || [];

		return new Promise(resolve => {
			this.getHelper().layoutManager.get(this.entityType, 'filters', list => {
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
					if (!this.advancedFilters[filter].selected) {
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

	setupSeedModel() {
		return new Promise(resolve => {
			this.getModelFactory().create(this.entityType, model => {
				this.seed = model;

				resolve();
			});
		});
	}

	data() {
		const data = super.data();

		data.entityType = this.entityType;
		data.filterList = Object.values(this.advancedFilters);
		data.filterDataList = Object.values(this.filterViewsMap);

		return data;
	}

	createFilterViews(callback) {
		const activeFilters = this.model.get(this.name) || {};
		const totalCount = Object.keys(activeFilters).length;
		let i = 0;

		return new Promise(resolve => {
			if (totalCount === 0) {
				resolve();
				return;
			}

			for (const filter in activeFilters) {
				this.createFilterView(filter, activeFilters[filter], view => {
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

	createFilterView(name, params, callback) {
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
			view => {
				this.listenTo(view, 'change', () => {
					this.trigger('change');
				});

				if (typeof callback === 'function') {
					callback(view);
				}
			},
		);
	}

	addFilter(name) {
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

	removeFilter(name) {
		this.advancedFilters[name].selected = false;
		delete this.filterViewsMap[name];

		this.reRender();

		this.trigger('change');
	}

	fetch() {
		const filterData = {};

		for (const filter in this.advancedFilters) {
			const view = this.getView('filter-' + filter);

			if (!this.advancedFilters[filter].selected) {
				continue;
			}

			let value = {};

			if (view) {
				value = view.getView('field').fetchSearch();
			}

			filterData[filter] = value;
		}

		const data = {};

		if (Object.keys(filterData).length > 0) {
			data[this.name] = filterData;
		} else {
			// In theory, it would make more sense to have an empty object here, but an empty object might be re-saved as an empty array by the backend. Thanks PHP!
			data[this.name] = null;
		}

		return data;
	}
});
