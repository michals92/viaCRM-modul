import type MainView from 'espocrm/src/views/main';

type ActionItem = {
	name?: string;
	action?: string;
	auxClick?: boolean;
};

type Menu = {
	buttons: ActionItem[];
	dropdown: ActionItem[];
};

extend<MainView>(Dep => class extends Dep {
	declare menu: Menu;

	override init(): void {
		super.init();

		this.setupEvents();
	}

	setupEvents(): void {
		this.events['auxclick .action'] = (e: JQuery.TriggeredEvent) => {
			const actionItems = [...this.menu.buttons, ...this.menu.dropdown];
			const $target = $(e.currentTarget as HTMLElement);
			const name = ($target.data('name') || $target.data('action')) as string;

			if (name) {
				const data = actionItems.find((item: ActionItem) => item.name === name || item.action === name);

				if (data && data.auxClick) {
					Espo.Utils.handleAction(this, e.originalEvent as Event, e.currentTarget as HTMLElement, {
						actionItems: actionItems,
						className: 'main-header-manu-action',
					});
				}
			}
		};
	}
});
