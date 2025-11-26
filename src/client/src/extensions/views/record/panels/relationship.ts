import type RelationshipPanelView from 'espocrm/src/views/record/panels/relationship';

extend<RelationshipPanelView>(['viacrm:helpers/version'], (Dep, VersionHelper) => class extends Dep {
	override template = 'viacrm:record/panels/relationship';

	searchView = 'views/record/search';

	detailSmallName: string | null = null;
	detailSmallEditName: string | null = null;

	getSearchDefaultData() {
		const defaultSearchData =
                this.getMetadata().get(['clientDefs', this.entityType, 'defaultFilterData']) || {};

		const defaultAdvancedFilters =
                this.getMetadata().get(['clientDefs', this.entityType, 'defaultAdvancedFilters']) || {};

		if (Object.keys(defaultAdvancedFilters).length) {
			defaultSearchData.advanced = defaultAdvancedFilters;
		}

		return defaultSearchData;
	}

	override setup() {
		this.filtersEnabled = this.defs.filtersEnabled || false;

		super.setup();

		if (this.filtersEnabled) {
			this.setupSearch();
		}

		const relationshipDefs = this.getMetadata().get(['clientDefs', this.model.name, 'relationshipPanels', this.panelName], {});

		this.detailSmallName = relationshipDefs?.layoutDetailSmall || null;
		this.detailSmallEditName = relationshipDefs?.layoutDetailSmallEdit || this.detailSmallName;
	}

	resetSorting() {
		this.getStorage().clear('listSorting', this.collection.name);
	}

	setupActions() {
		if (this.defs.select && this.defs?.displayLinkButtonInToolbar) {
			const selectButton = this.actionList.find(
				button => button.action === (this.defs.selectAction || 'selectRelated'),
			);

			if (selectButton) {
				// Remove the select button from buttonList
				this.actionList = this.actionList.filter(button => selectButton !== button);

				// Add the select button to the beginning of the actionList
				this.buttonList.push({
					title: 'Select',
					html: '<span class="fas fa-link"></span>',
					action: this.defs.selectAction || 'selectRelated',
					data: {
						link: this.link,
						primaryFilterName: selectButton.data?.primaryFilterName,
						boolFilterList: selectButton.data?.boolFilterList,
						massSelect: selectButton.data?.massSelect,
						createButton: selectButton.data?.createButton,
					},
					acl: this.defs.selectRequiredAccess || 'edit',
				});
			}
		}
	}

	async setupSearch() {
		this.searchManager = (new VersionHelper(this.getConfig()))
			.createSearchManager(
				this.collection,
				'list',
				this.getStorage(),
				this.getDateTime(),
				this.getSearchDefaultData(),
			);
		this.searchManager.setPrimary(this.filter);

		const view = await this.createView('search', this.searchView, {
			collection: this.collection,
			el: this.options.el + ' .search-container',
			searchManager: this.searchManager,
			scope: this.scope,
			isWide: true,
		});

		this.listenTo(view, 'reset', () => this.resetSorting());
		view.updateCollection();
	}

	setFilter(filter: string) {
		if (!this.filtersEnabled) {
			super.setFilter(filter);
			return;
		}

		this.filter = filter;

		const view = this.getView('search');

		if (view) {
			view.selectPreset(filter);
			this.collection.once('sync', () => Espo.Ui.notify(false));
		}
	}
});
