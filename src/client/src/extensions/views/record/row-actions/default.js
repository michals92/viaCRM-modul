extend(Dep => class extends Dep {
	getActionList() {
		const list = super.getActionList();

		if (
			this.getAcl().check(this.model.entityType, 'create') &&
				!this.getMetadata().get(['clientDefs', this.model.entityType, 'duplicateDisabled'])
		) {
			list.push({
				action: 'duplicate',
				label: 'Duplicate',
				data: {
					id: this.model.id,
				},
				handler: 'x',
				groupIndex: 0,
			});
		}

		return list;
	}
});
