define(['views/fields/base'], Dep => class extends Dep {
	editTemplate = 'autocrm:admin/entity-manager/fields/default-filter-data';

	events = {
		'click a[data-action="selectPreset"]': function (e) {
			const $target = $(e.currentTarget);

			const presetName = $target.data('name') || null;

			this.primary = presetName;

			this.reRender();
		},
		'change ul.filter-menu input[data-role="boolFilterCheckbox"]': function (e) {
			e.stopPropagation();

			this.boolFilterList.forEach(name => {
				this.bool[name] = this.$el
					.find('input[data-name="' + name + '"][data-role="boolFilterCheckbox"]')
					.prop('checked');
			});

			this.manageLabels();

			this.reRender();
		},
	};

	setup() {
		this.entityType = this.model.get('name');

		const filterData = this.model.get(this.name) || {};

		this.presetFilterList =
				this.options.filterList || this.getMetadata().get(['clientDefs', this.entityType, 'filterList']) || [];
		this.boolFilterList = this.boolFilterList = Espo.Utils.clone(
			this.getMetadata().get(['clientDefs', this.entityType, 'boolFilterList']) || [],
		);
		this.primary = filterData.primary || null;
		this.bool = filterData.bool || {};

		if (this.getMetadata().get(['scopes', this.entityType, 'stream'])) {
			this.boolFilterList.push('followed');
		}
	}
	getPrimaryFilterStyle() {
		let style = null;

		this.getPresetFilterList().forEach(item => {
			if (item.name === this.primary) {
				style = item.style || 'default';
			}
		});

		return style;
	}

	data() {
		return {
			...super.data(),
			presetFilterList: this.getPresetFilterList(),
			boolFilterList: this.boolFilterList,
			bool: this.bool,
			entityType: this.entityType,
		};
	}

	afterRender() {
		this.$filtersLabel = this.$el.find('span.filters-label');
		this.$filtersButton = this.$el.find('button.filters-button');
		this.$leftDropdown = this.$el.find('div.left-dropdown');
		this.$resetButton = this.$el.find('[data-action="reset"]');
		this.$applyFiltersContainer = this.$el.find('.advanced-filters-apply-container');
		this.$applyFilters = this.$applyFiltersContainer.find('[data-action="applyFilters"]');
		/** @type {JQuery} */
		this.$filterList = this.$el.find('ul.filter-list');
		/** @type {JQuery} */
		this.$fieldQuickSearch = this.$filterList.find('input.field-filter-quick-search-input');
		/** @type {JQuery} */

		this.manageLabels();
	}

	getPresetFilterList() {
		const arr = [];

		this.presetFilterList.forEach(item => {
			if (typeof item == 'string') {
				item = { name: item };
			}

			arr.push(item);
		});

		return arr;
	}

	manageLabels() {
		this.$el.find('ul.dropdown-menu > li.preset-control').addClass('hidden');

		this.currentFilterLabelList = [];

		this.managePresetFilters();
		this.manageBoolFilters();

		this.$filtersLabel.html(this.currentFilterLabelList.join(' &middot; '));
	}

	managePresetFilters() {
		const primary = this.primary;

		this.$el.find('ul.filter-menu a.preset span').remove();

		let filterLabel = this.translate('all', 'presetFilters', this.entityType);
		let filterStyle = 'default';

		if (primary) {
			const label = this.translate(primary, 'presetFilters', this.entityType);
			const style = this.getPrimaryFilterStyle();

			filterLabel = label;
			filterStyle = style;
		}

		this.currentFilterLabelList.push(filterLabel);

		this.$filtersButton
			.removeClass('btn-default')
			.removeClass('btn-primary')
			.removeClass('btn-danger')
			.removeClass('btn-success')
			.removeClass('btn-info');

		this.$filtersButton.addClass('btn-' + filterStyle);
	}

	manageBoolFilters() {
		(this.boolFilterList || []).forEach(item => {
			if (this.bool[item]) {
				const label = this.translate(item, 'boolFilters', this.entityType);

				this.currentFilterLabelList.push(label);
			}
		});
	}

	fetch() {
		return {
			[this.name]: {
				primary: this.primary,
				bool: this.bool,
			},
		};
	}
});
