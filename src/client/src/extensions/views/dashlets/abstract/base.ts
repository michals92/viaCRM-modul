import type BaseDashletView from 'espocrm/src/views/dashlets/abstract/base';

type OptionsFields = {
	title: {
		type: string;
		required: boolean;
	};
	autorefreshInterval: {
		type: string;
		options: number[];
	};
};

type DashletLayout = {
	id: string;
	collapsed?: boolean;
	[key: string]: unknown;
};

type GridStackItem = HTMLElement;

type Grid = {
	update(element: GridStackItem, options: Record<string, unknown>): void;
	resizable(element: GridStackItem, enabled: boolean): void;
};

type Dashboard = {
	grid: Grid;
	currentTabLayout: DashletLayout[];
	$gridstack: JQuery;
	fetchLayout(): void;
	saveLayout(): void;
};

extend<BaseDashletView>(Dep => class extends Dep {
	override optionsFields: OptionsFields = {
		title: {
			type: 'varchar',
			required: false,
		},
		autorefreshInterval: {
			type: 'enumFloat',
			options: [0, 0.5, 1, 2, 5, 10],
		},
	};

	override init(): void {
		super.init();

		if (this.getPreferences().get('collapsibleDashlets')) {
			let _class = 'fa fa-toggle-on';

			if (this.options.collapsed) {
				_class = 'fa fa-toggle-off';
			}

			this.buttonList.push({
				name: 'toggle',
				html: `<span class="${_class}"></span>`,
			});
		}
	}

	actionToggle(): void {
		this.collapseDashlet(this.id);
		this.$el.parent().find('button[data-name="toggle"] > span').toggleClass('fa-toggle-off fa-toggle-on');
	}

	getDashboard(): Dashboard {
		return this.getParentView().getParentView() as Dashboard;
	}

	getGrid(): Grid {
		return this.getDashboard().grid;
	}

	collapseDashlet(id: string): void {
		const dashlet = this.getDashboard().currentTabLayout.find(d => d.id === id);

		if (dashlet) {
			const $gridstackItem = this.getDashboard().$gridstack.find(`.grid-stack-item[data-id="${id}"]`);

			if (dashlet.collapsed) {
				const h = $gridstackItem.attr('gs-real-height');

				// Force re-render using minH
				this.getGrid().update($gridstackItem.get(0) as GridStackItem, {
					minH: h,
					h,
				});

				// Set back to 1, so we can resize
				this.getGrid().update($gridstackItem.get(0) as GridStackItem, {
					minH: 2,
				});
				this.getGrid().resizable($gridstackItem.get(0) as GridStackItem, true);
				this.reRender();
			} else {
				this.getGrid().update($gridstackItem.get(0) as GridStackItem, {
					minH: 1,
					h: 1,
				});

				this.getGrid().resizable($gridstackItem.get(0) as GridStackItem, false);
			}

			dashlet.collapsed = !(dashlet.collapsed ?? false);

			this.getDashboard().fetchLayout();
			this.getDashboard().saveLayout();
		}
	}
});
