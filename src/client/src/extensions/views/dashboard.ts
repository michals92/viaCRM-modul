import type DashboardView from 'espocrm/src/views/dashboard';

type GridStackModule = {
	init(options: GridStackOptions, element: HTMLElement): GridStackInstance;
};

type GridStackOptions = {
	cellHeight: number;
	margin: number;
	column: number;
	handle: string;
	disableDrag: boolean;
	disableResize: boolean;
	disableOneColumnMode: boolean;
	draggable: { distance: number };
	dragInOptions: { scroll: boolean };
	float: boolean;
	animate: boolean;
	scroll: boolean;
};

type GridStackInstance = {
	removeAll(): void;
	addWidget(element: HTMLElement, options: { x: number; y: number; w: number; h: number; sizeToContent: boolean }): void;
	resizable(element: HTMLElement, enabled: boolean): void;
	on(event: string, callback: (e: Event, el?: HTMLElement) => void): void;
};

type DashletLayoutItem = {
	id: string;
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	collapsed?: boolean;
};

type DashletView = {
	render(): void;
	trigger(event: string): void;
	getView(name: string): { afterAdding?: () => void; trigger: (event: string) => void } | null;
};

extend<DashboardView>(['viacrm:helpers/version'], (Dep) => class extends Dep {
	declare GridStack: GridStackModule;
	declare $dashboard: JQuery;
	declare $gridstack: JQuery;
	declare grid: GridStackInstance;
	declare currentTabLayout: DashletLayoutItem[];
	declare dashboardLayout: Array<{ layout: DashletLayoutItem[] }>;
	declare currentTab: number;
	declare dashletIdList: string[];
	declare dashletsReadOnly: boolean;
	declare fallbackModeTimeout?: ReturnType<typeof setTimeout>;
	declare WIDTH_MULTIPLIER: number;

	override setup(): void {
		super.setup();

		this.wait(
			Espo.loader.requirePromise('gridstack').then((gs: GridStackModule) => this.GridStack = gs),
		);
	}

	override initGridstack(): void {
		if (!this.getPreferences().get('collapsibleDashlets')) {
			super.initGridstack();
			return;
		}

		if (this.isFallbackMode()) {
			this.preserveDashletViews();
		}

		this.$dashboard.empty();

		let $gridstack = (this.$gridstack = this.$dashboard);

		$gridstack.removeClass('fallback');

		if (this.fallbackModeTimeout) {
			clearTimeout(this.fallbackModeTimeout);
		}

		let disableDrag = false;
		let disableResize = false;

		if (this.getUser().isPortal() || this.getPreferences().get('dashboardLocked')) {
			disableDrag = true;
			disableResize = true;
		}

		let grid = (this.grid = this.GridStack.init(
			{
				cellHeight: this.getCellHeight(),
				margin: (this.getThemeManager().getParam('dashboardCellMargin') as number) / 2,
				column: 12,
				handle: '.panel-heading',
				disableDrag,
				disableResize,
				disableOneColumnMode: true,
				draggable: {
					distance: 10,
				},
				dragInOptions: {
					scroll: false,
				},
				float: false,
				animate: false,
				scroll: false,
			},
			$gridstack.get(0) as HTMLElement,
		));

		grid.removeAll();

		this.currentTabLayout.forEach((o: DashletLayoutItem) => {
			let $item = this.prepareGridstackItem(o.id, o.name) as JQuery;

			if (!this.getMetadata().get(['dashlets', o.name])) {
				return;
			}

			grid.addWidget($item.get(0) as HTMLElement, {
				x: o.x * this.WIDTH_MULTIPLIER,
				y: o.y,
				w: o.width * this.WIDTH_MULTIPLIER,
				h: o.collapsed === true ? 1 : o.height,
				sizeToContent: true,
			});

			grid.resizable($item.get(0) as HTMLElement, o.collapsed !== true);
			$item.attr('gs-real-height', o.height.toString());
		});

		$gridstack.find('.grid-stack-item').css('position', 'absolute');

		this.currentTabLayout.forEach((o: DashletLayoutItem) => {
			if (!o.id || !o.name) {
				return;
			}

			if (!this.getMetadata().get(['dashlets', o.name])) {
				console.error('Dashlet ' + o.name + " doesn't exist or not available.");

				return;
			}

			if (this.hasPreservedDashlets()) {
				this.addPreservedDashlet(o.id);

				return;
			}

			this.createDashletView(o.id, o.name);
		});

		this.clearPreservedDashlets();

		this.grid.on('change', () => {
			this.fetchLayout();
			this.saveLayout();
		});

		// noinspection SpellCheckingInspection
		this.grid.on('resizestop', (e: Event, el?: HTMLElement) => {
			if (el) {
				el.setAttribute('gs-real-height', el.getAttribute('gs-h') || '');
			}

			let id = $(e.target as HTMLElement).data('id') as string;
			let view = this.getView('dashlet-' + id) as DashletView | null;

			if (!view) {
				return;
			}
			view.trigger('resize');
		});
	}

	override createDashletView(id: string, name: string, label?: string, callback?: (view: DashletView) => void): void {
		if (!this.getPreferences().get('collapsibleDashlets')) {
			super.createDashletView(id, name, label, callback);
			return;
		}

		let o: { id: string; name: string; label?: string } = {
			id: id,
			name: name,
		};

		if (label) {
			o.label = label;
		}

		return this.createView(
			'dashlet-' + id,
			'views/dashlet',
			{
				...o,
				selector: '> .dashlets .dashlet-container[data-id="' + id + '"]',
				readOnly: this.dashletsReadOnly,
				locked: this.getPreferences().get('dashboardLocked'),
				collapsed: this.currentTabLayout.find((dashlet: DashletLayoutItem) => dashlet.id === id)?.collapsed,
			},
			(view: DashletView) => {
				this.dashletIdList.push(id);

				view.render();

				this.listenToOnce(view, 'change', () => {
					this.clearView(id);

					this.createDashletView(id, name, label);
				});

				this.listenToOnce(view, 'remove-dashlet', () => this.removeDashlet(id));

				if (callback) {
					callback.call(this, view);
				}
			},
		);
	}

	override addDashlet(name: string): void {
		if (!this.getPreferences().get('collapsibleDashlets')) {
			super.addDashlet(name);
			return;
		}

		let revertToFallback = false;

		if (this.isFallbackMode()) {
			this.initGridstack();

			revertToFallback = true;
		}

		let id = 'd' + Math.floor(Math.random() * 1000001).toString();

		let $item = this.prepareGridstackItem(id, name) as JQuery;

		this.grid.addWidget($item.get(0) as HTMLElement, {
			x: 0,
			y: 0,
			w: 2 * this.WIDTH_MULTIPLIER,
			h: 2,
			sizeToContent: true,
		});

		this.createDashletView(id, name, name, (view: DashletView) => {
			let $new = this.$gridstack.find(`.grid-stack-item[data-id="${id}"]`);

			$new.attr('gs-real-height', (2 * this.WIDTH_MULTIPLIER).toString());

			this.fetchLayout();
			this.saveLayout();

			this.setupCurrentTabLayout();

			if (view.getView('body') && view.getView('body')!.afterAdding) {
				view.getView('body')!.afterAdding!.call(view.getView('body'));
			}

			if (revertToFallback) {
				this.initFallbackMode();
			}
		});
	}

	getCellHeight(): number {
		if (this.getPreferences().get('collapsibleDashlets')) {
			return (
				parseFloat(window
					.getComputedStyle(document.documentElement)
					.getPropertyValue('--panel-heading-height')
					.replace('px', '')) * 1.55
			);
		} else {
			return (this.getThemeManager().getParam('dashboardCellHeight') as number) * 1.14;
		}
	}

	override fetchLayout(): void {
		if (!this.getPreferences().get('collapsibleDashlets')) {
			super.fetchLayout();
			return;
		}

		this.dashboardLayout[this.currentTab].layout = _.map(this.$gridstack.find('.grid-stack-item'), (el: HTMLElement) => {
			let $el = $(el);

			const id = $el.data('id') as string;

			let collapsed = false;

			const dashlet = this.currentTabLayout.find((d: DashletLayoutItem) => d.id === id);

			if (dashlet) {
				collapsed = dashlet.collapsed ?? false;
			}

			let x = parseInt($el.attr('gs-x') || '0', 10);
			let y = parseInt($el.attr('gs-y') || '0', 10);
			let height = parseInt($el.attr('gs-real-height') || '0', 10);
			let w = parseInt($el.attr('gs-w') || '0', 10);

			return {
				id,
				name: $el.data('name') as string,
				x: x / this.WIDTH_MULTIPLIER,
				y,
				width: w / this.WIDTH_MULTIPLIER,
				height,
				collapsed,
			};
		});
	}
});
