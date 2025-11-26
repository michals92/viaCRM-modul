import type ActionHandler from 'espocrm/src/action-handler';
import type Metadata from 'espocrm/src/metadata';
import type Model from 'espocrm/src/model';
import type User from 'espocrm/src/models/user';
import type View from 'espocrm/src/bull/view';
import type { CreateTemplateViewOptions } from 'viacrm/types';

interface DropdownItem {
	name: string;
	[key: string]: unknown;
}

interface CreateTemplateView extends View {
	model: Model & { name: string; id: string; attributes: Record<string, unknown> };
	scope: string;
	dropdownItemList: DropdownItem[];
	getUser(): User;
	getMetadata(): Metadata;
	showActionItem(name: string): void;
	hideActionItem(name: string): void;
	createView(
		name: string,
		viewName: string,
		options: CreateTemplateViewOptions,
		callback: (view: View & { render(): void }) => void
	): void;
}

define(
	['action-handler'],
	(Dep: typeof ActionHandler) => class extends Dep {
		name = 'createTemplate';

		declare view: CreateTemplateView;

		init(): void {
			const showActionItemOrg = this.view.showActionItem;

			// Override showActionItem to show the action item only if the record is recurring
			// this is necessary because the showActionItem is called after the handler is initialized
			this.view.showActionItem = (name: string): void => {
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

		actionCreateTemplate(): void {
			Espo.Ui.notifyWait();
			const viewName =
				(this.view.getMetadata().get(['clientDefs', this.view.scope, 'modalViews', 'edit']) as string) ||
				'views/modals/edit';

			const data = {...this.view.model.attributes};

			delete data['id'];

			this.view.createView(
				'quickCreate',
				viewName,
				{
					scope: 'RecordTemplate',
					attributes: {
						entityType: this.view.scope,
						data,
					},
					fullFormDisabled: true,
				},
				view => {
					view.render();
					Espo.Ui.notify(false);
				},
			);
		}
	},
);
