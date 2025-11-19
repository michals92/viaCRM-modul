extend(Dep => class extends Dep {
	init() {
		super.init();

		this.setupEvents();
	}

	setupEvents() {
		this.events['auxclick .action'] = e => {
			const actionItems = [...this.menu.buttons, ...this.menu.dropdown];
			const $target = $(e.currentTarget);
			const name = $target.data('name') || $target.data('action');

			if (name) {
				const data = actionItems.find(item => item.name === name || item.action === name);

				if (data && data.auxClick) {
					Espo.Utils.handleAction(this, e.originalEvent, e.currentTarget, {
						actionItems: actionItems,
						className: 'main-header-manu-action',
					});
				}
			}
		};
	}
});
