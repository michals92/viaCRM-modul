interface ViewWithEvents {
	disableQuickViewContextMenu?: boolean;
	getPreferences(): { get(key: string): boolean };
	events: Record<string, (e: Event) => void>;
	actionQuickView(options: { id: string }): void;
}

define(
	[],
	() => class QuickViewContextMenuHelper {
		register(view: ViewWithEvents, selector: string): void {
			if (view.disableQuickViewContextMenu === true) {
				return;
			}

			const enabled = view.getPreferences().get('quickViewContextMenu');

			if (!enabled) {
				return;
			}

			view.events[`mouseover ${selector}`] = (e: Event) => {
				const el = e.currentTarget as HTMLElement;
				el.classList.add('quick-view-context-menu');
			};

			view.events[`mouseout ${selector}`] = (e: Event) => {
				const el = e.currentTarget as HTMLElement;
				el.classList.remove('quick-view-context-menu');
			};

			view.events[`contextmenu ${selector}`] = (e: Event) => {
				const el = e.currentTarget as HTMLElement;

				const id = el.getAttribute('data-id');

				if (id) {
					e.preventDefault();
					e.stopPropagation();
					view.actionQuickView({ id });
				}
			};
		}
	},
);
