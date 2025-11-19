import type ListView from 'espocrm/src/views/list';
import type ActionHandler from 'espocrm/src/action-handler';

define(['action-handler'], (Dep: typeof ActionHandler<ListView>) => class extends Dep {
	actionCreateFromTemplate() {
		Espo.Ui.notifyWait();

		this.view.createView(
			'selectTemplateDialog',
			'autocrm:views/modals/select-record-template',
			{
				entityType: this.view.scope,
			},
			view => {
				view.render();
				Espo.Ui.notify(false);

				this.view.listenTo(view, 'select', model => {
					Espo.Ui.notifyWait();

					model.fetch().then(() => {
						const orgAttributesFunc = this.view.getCreateAttributes;
						const newAttributes = model.get('data');

						if (this.view.getAcl().getPermissionLevel('assignmentPermission') === 'no') {
							delete newAttributes.assignedUserId;
						}

						this.view.getCreateAttributes = () => newAttributes;
						this.view.actionCreate();

						this.view.getCreateAttributes = orgAttributesFunc;

						Espo.Ui.notify(false);
					});
				});
			},
		);
	}

	checkVisibility() {
		const recordTemplateEntityList: string[] = this.view.getHelper().getAppParam('recordTemplateEntityTypeList') || [];

		return recordTemplateEntityList.includes(this.view.scope);
	}

	init() {
		// Move the button to the second position
		const buttons = this.view.menu.buttons;

		if (!buttons) {
			return;
		}

		const orgIndex = buttons.findIndex(button => button.action === 'createFromTemplate');
		const toIndex = buttons.some(button => button.action === 'create') ? 1 : 0;

		if (orgIndex !== toIndex) {
			const button = buttons[orgIndex];

			if (button) {
				buttons.splice(orgIndex, 1);
				buttons.splice(toIndex, 0, button);
			}
		}
	}
});