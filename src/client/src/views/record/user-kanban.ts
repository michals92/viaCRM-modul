define(['views/record/kanban'], Dep => class extends Dep {
	layoutName = 'userKanban';

	setup() {
		// kanban setup throws an error if statusField is not set, it's easier to just set it to a dummy value than override the whole setup method
		this.options.statusField = 'assignedUserId';

		super.setup();
	}
		
	storeGroupOrder(group, id) {
		const ids = this.getGroupOrderFromDom(group);

		if (id) {
			ids.unshift(id);
		}

		return Espo.Ajax.putRequest('UserKanban/order', {
			entityType: this.entityType,
			group,
			ids,
		});
	}

	async actionCreateInGroup(group) {
		this.getCreateAttributes = () => {
			const groupData = this.groupDataList.find(g => g.name === group);

			if (groupData) {
				return {
					assignedUserId: group,
					assignedUserName: groupData.label
				};
			} else {
				return {};
			}
		};

		return super.actionCreateInGroup(group);
	}
});
