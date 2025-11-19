extend(['ui/multi-select', 'ui/select'], (Dep, MultiSelect, Select) => class extends Dep {
	
	detailTemplate = 'autocrm:fields/enum/detail';
	listTemplate = 'autocrm:fields/enum/list';

	data() {
		const value = this.model.get(this.name);

		const iconClass = (this.params.icons || this.model.getFieldParam(this.name, 'icons') || {})[value];

		return {
			iconClass,
			...super.data()
		};
	}

	initElement() {
		this.$element = this.$el.find('[data-name="' + this.name + '"]');

		if (!this.$element.length) {
			this.$element = this.$el.find('[name="' + this.name + '"]');
		}

		if (!this.$element.length) {
			this.$element = this.$el.find('.main-element');
		}

		if (this.isEditMode()) {
			this.$element.on('change', () => {
				this.trigger('change');
			});
		}
	}
	afterRender() {
		if (this.isEditMode() || this.isSearchMode()) {
			this.initElement();
		}

		if (this.isReadMode()) {
			this.afterRenderRead();
		}

		if (this.isListMode()) {
			this.afterRenderList();
		}

		if (this.isDetailMode()) {
			this.afterRenderDetail();
		}

		if (this.isEditMode()) {
			this.afterRenderEdit();
		}

		if (this.isSearchMode()) {
			this.afterRenderSearch();
		}

		if (this.isSearchMode()) {
			this.$element = this.$el.find('.main-element');

			const type = this.$el.find('select.search-type').val();

			this.handleSearchType(type);

			const valueList = this.getSearchParamsData().valueList || this.searchParams.value || [];

			this.$element.val(valueList.join(':,:'));

			const items = [];

			(this.params.options || []).forEach(value => {
				let label = this.getLanguage().translateOption(value, this.name, this.scope);

				if (this.translatedOptions) {
					if (value in this.translatedOptions) {
						label = this.translatedOptions[value];
					}
				}

				if (label === '') {
					return;
				}

				items.push({
					value: value,
					text: label,
				});
			});

			/** @type {module:ui/multi-select~Options} */
			const multiSelectOptions = {
				items: items,
				delimiter: ':,:',
				matchAnyWord: true,
			};

			MultiSelect.init(this.$element, multiSelectOptions);

			this.$el.find('.selectize-dropdown-content').addClass('small');
			this.$el.find('select.search-type').on('change', () => this.trigger('change'));
			this.$element.on('change', () => this.trigger('change'));
		}

		if (this.isEditMode() || this.isSearchMode()) {
			// Add a flag to track if Select has been initialized
			this._selectInitialized = false;

			// Initialize Select on mouseenter, but only once
			this.$element.on('mouseenter', () => {
				if (!this._selectInitialized) {
					Select.init(this.$element, { matchAnyWord: true });
					this._selectInitialized = true;
				}
			});
		}
	}
});
