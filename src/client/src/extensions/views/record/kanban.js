extend(Dep => class extends Dep {
	template = 'autocrm:record/kanban';

	buildRows(callback) {
		super.buildRows(() => {
			this.groupDataList.forEach((item, i) => {
				const iconClass =
						item.iconClass ||
						this.getMetadata().get(
							['entityDefs', this.scope, 'fields', this.statusField, 'icons', item.name],
							null,
						);

				item.iconClass = iconClass;
				item.color = this.groupRawDataList[i].color;
			});

			if (callback) {
				callback();
			}
		});
	}
});
