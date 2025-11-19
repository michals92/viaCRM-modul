extend(Dep => class extends Dep {
	template = 'autocrm:record/list-nested-categories';

	getDataList() {
		const list = [];

		this.collection.forEach(model => {
			let url = '#' + this.subjectEntityType + '/list/categoryId=' + model.id;

			if (this.options.primaryFilter) {
				url += '&primaryFilter=' + this.getHelper().escapeString(this.options.primaryFilter);
			}

			const o = {
				id: model.id,
				name: model.get('name'),
				recordCount: model.get('recordCount'),
				isEmpty: model.get('isEmpty'),
				color: model.get('color'),
				iconClass: model.get('iconClass') || 'far fa-folder',
				link: url,
			};

			list.push(o);
		});

		return list;
	}
});
