import type QuickViewHelperType from 'viacrm:helpers/quick-view-context-menu';

interface ViewWithEvents {
	disableQuickViewContextMenu?: boolean;
	getPreferences(): { get(key: string): boolean };
	events: Record<string, (e: Event) => void>;
	actionQuickView(options: { id: string }): void;
}

define(
	['viacrm:helpers/quick-view-context-menu'],
	(QuickViewHelper: typeof QuickViewHelperType) => class {
		view: ViewWithEvents;

		constructor(view: ViewWithEvents) {
			this.view = view;
		}

		process(): void {
			new QuickViewHelper().register(this.view, '.grid-item');
		}
	},
);
