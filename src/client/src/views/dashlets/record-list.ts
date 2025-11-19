import type View from 'espocrm/src/bull/view';

define(['views/dashlets/records'], Dep => class extends Dep {
	name = 'Kanban';

	override listView = 'views/record/list';

	override setup() {
		super.setup();

		this.listView =
				this.getMetadata().get<string>(['clientDefs', this.scope, 'recordViews', 'listDashlet']) ||
				this.getMetadata().get<string>(['clientDefs', this.scope, 'recordViews', 'list']) ||
				this.listView;
	}

	override getSearchData() {
		const searchData = super.getSearchData();

		const advancedFilters = this.getOption('advancedFilters');

		if (advancedFilters) {
			searchData.advanced = advancedFilters;
		}

		return searchData;
	}

	override createView<T extends View = View>(
		key: string,
		viewName: string,
		options?: any, // OOF
		callback?: (view: T) => void,
		wait?: boolean,
	): Promise<T> {
		if (key === 'list') {
			if (options) {
				options.layoutName = this.getOption('layout');

				delete options.listLayout;
			}
		}

		//@ts-ignore Hacky, can't be typed.
		return super.createView(key, viewName, options, callback, wait);
	}
});
