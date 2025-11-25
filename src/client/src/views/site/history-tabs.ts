import type View from 'espocrm/src/view';
import type MainView from 'espocrm/src/views/main';

interface RouterParams {
	controller: string | null;
	action: string | null;
	options: any;
}

interface Tab {
	params?: RouterParams;
	title: string;
}

define(['view'], (Dep: typeof View) => class extends Dep {
	override template = 'viacrm:site/history-tabs';

	tabsStorageKey = 'historyTabs';

	maxTabCount = 5;

	#tabs: string[] = [];

	#tabMap: Map<string, Tab> = new Map();

	#activeTab: string | null = null;

	override setup() {
		if (!this.getPreferences().get('enableHistoryTabs')) {
			return;
		}

		this.setupEvents();

		this.maxTabCount = this.getConfig().get('maxTabCount') || this.maxTabCount;
		this.#tabs = [];
		this.#tabMap.clear();
		this.#activeTab = null;

		this.loadTabs();
		this.setupRouter();

		this.once('remove', () => {
			$(window).off('resize.history-tabs');
			$(window).off('scroll.history-tabs');
		});
	}


	setupEvents() {
		this.addActionHandler('open-tab', (ev, target: HTMLElement) => {
			if ($(ev.target!).closest('.close-tab').length) return;

			this.getRouter().checkConfirmLeaveOut(() => {
				const url = this.getTargetTabUrl(target);

				this.openTab(url);
			});
		});

		this.addActionHandler('close-tab', (ev, target: HTMLElement) => {
			ev.stopPropagation();

			const url = this.getTargetTabUrl(target);

			this.closeTab(url);
		});
	}

	closeTab(url: string) {
		const index = this.#tabs.indexOf(url);

		if (index === -1) return;

		const remove = () => {
			this.#tabs.splice(index, 1);
			this.#tabMap.delete(url);
		};

		remove();

		this.saveTabs();

		void this.reRender();
	}

	openTab(url: string) {
		if (!this.#tabMap.has(url)) return;

		this.#activeTab = url;
		const tab = this.#tabMap.get(url)!;

		if (tab.params) {
			const { controller, action, options } = tab.params!;

			this.getRouter().navigate(url);
			this.getRouter().dispatch(controller, action, options);
		} else {
			this.getRouter().navigate(url, { trigger: true });
		}

		void this.reRender();
	}

	getTargetTabUrl(target: HTMLElement) {
		return $(target).closest('.history-tab').data('tab') as string;
	}

	loadTabs() {
		const { tabs, map } = this.getStorage().get('state', this.tabsStorageKey) || {
			tabs: [],
			map: [],
		};

		this.#tabs = tabs;
		this.#tabMap = new Map(map);
	}

	saveTabs() {
		this.getStorage().set('state', this.tabsStorageKey, {
			tabs: this.#tabs,
			// don't save `params`, as there may be non-serializable data
			map: [...this.#tabMap].map(([url, { title }]) => [url, { title }]),
		});
	}

	setupRouter() {
		const router = this.getRouter();

		router.on('routed', async (params: RouterParams) => {
			await this.handleRoute(params);
		});

		this.handleRoute(router.getLast());
	}

	async handleRoute(params: RouterParams) {
		if (!params.controller || params.controller === 'Home') return;

		const router = this.getRouter();
		const url = router.getCurrentUrl();

		const mainView = await this.waitForMainView();

		// use map for O(1) lookup
		if (!this.#tabMap.has(url)) {
			if (url !== router.getCurrentUrl()) return;

			const title = this.getPageTitle() || 'Tab #' + (this.#tabs.length + 1);

			await this.pushTab(url, title, params);
		} else {
			const tab = this.#tabMap.get(url)!;

			tab.params = params;

			tab.title = this.getPageTitle() || tab.title;

			// Cache model for record routes for faster switching.
			if (params.action === 'view' && 'id' in params.options && mainView.model) {
					tab.params!.options.model = mainView.model;
			}
		}

		this.#activeTab = url;
		this.saveTabs();

		await this.reRender();
	}

	async waitForMainView() {
		let view: View | null = null;

		if (!this.isReady) {
			// TODO: BC, use `whenReady` later
			await new Promise<void>(resolve => {
				if (this.isReady) {
					return resolve();
				} else {
					this.once('ready', () => resolve());
				}
			});

			view = this.getMasterView()?.getView('main') ?? null;
		}

		if (!view) {
			view = await new Promise<View>(resolve => {
				this.listenToOnce(this.getMasterView()!, 'main-view-set', (view: any) => resolve(view));
			});
		}

		const mainView = view;

		return new Promise<View>(resolve => {
			if (mainView.isRendered()) {
				resolve(mainView);
			}

			this.listenToOnce(mainView, 'after:render', () => {
				resolve(mainView);
			});
		});
	}

	/**
		 * Try to get page title from (in order):
		 *
		 * 1. Header breadcrumbs
		 * 2. Custom page header
		 * 3. View title
		 * 4. Controller name
		 */
	getPageTitle(): string | null {
		const header = $('#main > .page-header');

		if (!header.length) {
			const mainView = this.getMasterView()?.getView<MainView>('main');

			if (!mainView) {
				return null;
			}

			if (!('updatePageTitle' in mainView)) {
				return this.getRouter().getLast().controller || null;
			}

			mainView.updatePageTitle();

			return document.title;
		}

		const breadcrumbItems = header.find('.breadcrumb-item');

		if (!breadcrumbItems.length) return header.text();

		return breadcrumbItems
			.map((_, item) => $(item).text().trim())
			.get()
			.reverse() // most relevant breadcrumb is usually the last one
			.join(' - ');
	}

	async pushTab(url: string, title: string, params: RouterParams) {
		if (this.#tabs.length >= this.maxTabCount) {
			return;
		}

		this.#tabs.push(url);
		this.#tabMap.set(url, {
			params,
			title,
		});
	}

	override data() {
		return {
			tabs: this.getTabs(),
		};
	}

	getTabs() {
		return this.#tabs.map(url => ({
			url,
			...this.#tabMap.get(url)!,
			active: url === this.#activeTab,
		}));
	}

	getMasterView(): View | null {
		// navbar -> header -> master
		// @ts-ignore - accessing parent views beyond type definitions
		return this.getParentView()?.getParentView()?.getParentView() ?? null;
	}
});
