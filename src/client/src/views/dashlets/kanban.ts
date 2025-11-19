import type { AdvancedFilter } from 'espocrm/src/search-manager';

define(['views/dashlets/records'], Dep => class extends Dep {
	name = 'Kanban';

	//@ts-ignore - oof
	collectionUrl: string;

	override setup() {
		super.setup();

		const recordViews =
				this.getMetadata().get<{ kanbanDashlet?: string; kanban?: string }>([
					'clientDefs',
					this.scope,
					'recordViews',
				]) || {};

		this.listView = recordViews.kanbanDashlet ?? recordViews.kanban ?? 'views/record/kanban';

		this.collectionUrl = 'Kanban/' + this.scope;
	}

	override getSearchData() {
		const searchData = super.getSearchData();

		const advancedFilters = this.getOption<Record<string, AdvancedFilter>>('advancedFilters');

		if (advancedFilters) {
			searchData.advanced = advancedFilters;
		}

		return searchData;
	}

	override actionRefresh() {
		const listView = this.getView('list');

		const quickCreate = this.getView('quickCreate');

		if (listView && quickCreate && quickCreate.isRendered()) {
			return;
		}

		super.actionRefresh();
	}
});
