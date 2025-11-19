define(['action-handler'], Dep => class extends Dep {
	name = 'createTemplate';

	init() {
		const showActionItemOrg = this.view.showActionItem;

		// Override showActionItem to show the action item only if the record is recurring
		// this is necessary because the showActionItem is called after the handler is initialized
		this.view.showActionItem = name => {
			if (name === this.name) {
				// intercept only the first call
				this.view.showActionItem = showActionItemOrg;

				if (!this.view.getUser().isAdmin()) {
					this.view.hideActionItem(this.name);
					return;
				}
			}
			showActionItemOrg.call(this.view, name);
		};

		// move to last position
		const items = this.view.dropdownItemList;
		const index = items.findIndex(item => item.name === this.name);
		items.push(items.splice(index, 1)[0]);
	}

	actionCreateTemplate() {
		Espo.Ui.notifyWait();
		const viewName =
				this.view.getMetadata().get(['clientDefs', this.view.scope, 'modalViews', 'edit']) ||
				'views/modals/edit';

		const data = this.view.model.attributes;

		delete data['id'];

		this.view.createView(
			'quickCreate',
			viewName,
			{
				scope: 'RecordTemplate',
				attributes: {
					entityType: this.view.scope,
					data
				},
				fullFormDisabled: true,
			},
			view => {
				view.render();
				Espo.Ui.notify(false);
			},
		);
	}
});