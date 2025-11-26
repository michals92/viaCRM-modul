import type ListNestedCategoriesRecordView from 'espocrm/src/views/record/list-nested-categories';

interface CategoryModel {
	id: string;
	get(name: string): unknown;
}

interface CategoryDataItem {
	id: string;
	name: string;
	recordCount: number;
	isEmpty: boolean;
	color: string;
	iconClass: string;
	link: string;
}

extend<ListNestedCategoriesRecordView>(Dep => class extends Dep {
	override template = 'viacrm:record/list-nested-categories';

	override getDataList(): CategoryDataItem[] {
		const list: CategoryDataItem[] = [];

		this.collection.forEach((model: CategoryModel) => {
			let url = '#' + this.subjectEntityType + '/list/categoryId=' + model.id;

			if (this.options.primaryFilter) {
				url += '&primaryFilter=' + this.getHelper().escapeString(this.options.primaryFilter);
			}

			const o: CategoryDataItem = {
				id: model.id,
				name: model.get('name') as string,
				recordCount: model.get('recordCount') as number,
				isEmpty: model.get('isEmpty') as boolean,
				color: model.get('color') as string,
				iconClass: (model.get('iconClass') as string) || 'far fa-folder',
				link: url,
			};

			list.push(o);
		});

		return list;
	}
});
