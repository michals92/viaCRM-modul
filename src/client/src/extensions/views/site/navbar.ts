import type {LogoHelper as LogoHelperType} from 'viacrm:helpers/logo';
import type NavbarView from 'espocrm/src/views/site/navbar';

interface TabItem {
	type?: string;
	link?: string;
	text?: string;
	color?: string;
	iconClass?: string;
	itemList?: TabItem[];
	url?: string;
}

interface TabDefs {
	link: string;
	label: string;
	shortLabel: string;
	name: string;
	isInMore: boolean;
	color?: string;
	iconClass?: string;
	isAfterShowMore: boolean;
	aClassName: string;
	isGroup: boolean;
	isHidden?: boolean;
	className?: string;
	colorIconClass?: string;
}

interface TabVars {
	moreIsMet: boolean;
	isHidden: boolean;
}

interface RouterEvent {
	controller: string;
	action: string;
}

interface HistoryTabsView {
	render(): void;
}

interface ShepherdClass {
	new(helper: unknown): { start(force: boolean): void };
}

extend<NavbarView>(
	['viacrm:helpers/logo'],
	(Dep, LogoHelper: typeof LogoHelperType) => class extends Dep {
		emailCheckInterval = 60;
		historyTabsView = 'viacrm:views/site/history-tabs';
		useWebSocket!: boolean;
		lastController: string | null = null;
		$emailCountBadge!: JQuery;
		timeout?: ReturnType<typeof setTimeout>;
		declare currentTab: string;
		declare menuDataList: Array<{ name: string; label: string }>;

		override setup(): void {
			super.setup();

			this.useWebSocket = this.getConfig().get('useWebSocket') as boolean;
			this.emailCheckInterval = (this.getConfig().get('emailCheckInterval') as number) || this.emailCheckInterval;
			this.lastController = null;

			this.getRouter().on('routed', (e: RouterEvent) => {
				if ((e.controller === 'Email' && e.action === 'view') || this.lastController === 'Email') {
					this.runCheckNewEmails();
				}

				this.lastController = e.controller;
			});
		}

		// Overriden to replace the default logo with AutoERP logo
		override getLogoSrc(): string {
			const logoHelper = new LogoHelper(this.getConfig(), this.getHelper(), this.getThemeManager());

			return logoHelper.getLogoSrc();
		}

		isViewingAs(): boolean {
			return document.cookie.indexOf('view-as-user-id') > -1;
		}

		override setupMenu(): void {
			super.setupMenu();

			if (this.isViewingAs()) {
				const logoutItem = this.menuDataList.find(item => item.name === 'logout');

				if (logoutItem) {
					logoutItem.label = this.translate('Return to My Account') as string;
				}
			}
		}

		/**
		 * Custom logout handler for "view as user" feature
		 * When admin is viewing as another user:
		 * - Logout means "Return to admin account" (not actual logout)
		 * - Clears view-as-user cookie
		 * - Clears cache and reloads page
		 */
		actionLogout(): void {
			if (!this.isViewingAs()) {
				super.actionLogout();
				return;
			}

			document.cookie = 'view-as-user-id=; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';

			Espo.Ajax.postRequest('Admin/clearCache').then(() => {
				setTimeout(() => window.location.reload(), 1);
			});
		}

		override afterRender(): void {
			super.afterRender();

			this.addShepherdButton();
			this.setupEmailCountBadge();
			this.runCheckNewEmails();
			this.prepareTabCustomLinks();

			if (this.getUser().isAdmin() && this.getConfig().get('editNavbarEnabled')) {
				this.addEditButton();
			}

			if (this.getPreferences().get('enableHistoryTabs')) {
				void this.createHistoryTab();
			}
		}

		setupEmailCountBadge(): void {
			const emailCountBadge = $('#email-count-badge');

			if (emailCountBadge.length) {
				this.$emailCountBadge = emailCountBadge;
				return;
			}

			this.$emailCountBadge = $('<span class="badge number-badge"></span>');
			this.$emailCountBadge.hide();

			const $wrapper = $('<div id="email-count-badge"></div>');
			$wrapper.append(this.$emailCountBadge);
			$("a[href='#Email']").append($wrapper);
		}

		runCheckNewEmails(): void {
			this.checkNewEmails();

			if (this.useWebSocket && this.getHelper().webSocketManager) {
				this.getHelper().webSocketManager.subscribe('newNotification', () => {
					this.checkNewEmails();
				});

				return;
			}

			if (this.timeout) {
				clearTimeout(this.timeout);
			}

			this.timeout = setTimeout(() => this.runCheckNewEmails(), this.emailCheckInterval * 1000);
		}

		checkNewEmails(): void {
			Espo.Ajax.getRequest('Email/inbox/notReadCounts').then((data: { inbox?: number }) => {
				const count = data.inbox || 0;

				this.$emailCountBadge.text(count > 99 ? '99+' : count.toString());
				this.$emailCountBadge.toggle(count > 0);
			});
		}

		prepareTabCustomLinks(): void {
			this.$el.find('ul.nav li a.nav-custom-link:not([href^="#"])').attr('target', '_blank');
		}

		filterTabItem(tab: TabItem | string): boolean {
			const original = super.filterTabItem?.(tab) || (this as unknown as { tabsHelper?: { checkTabAccess?(tab: TabItem | string): boolean } }).tabsHelper?.checkTabAccess?.(tab);
			return original || (typeof tab === 'object' && tab.type === 'customLink' && !!tab.link);
		}

		override setupTabDefsList(): void {
			const tabList = this.getTabList().filter((item: TabItem | string | null) => {
				if (!item) {
					return false;
				}

				if (typeof item === 'object') {
					switch (item.type) {
						case 'customLink':
							return !!item.link;
						case 'divider':
							return true;
						case 'url':
							return !!item.url;
						default:
							item.itemList = item.itemList || [];
							item.itemList = item.itemList.filter(this.filterTabItem.bind(this));

							return !!item.itemList.length;
					}
				}

				return this.filterTabItem(item);
			});

			Object.defineProperty(this, 'tabList', {
				set(_) {
				},
				get: () => tabList,
				configurable: true,
			});

			super.setupTabDefsList();
		}

		override prepareTabItemDefs(params: unknown, tab: TabItem | string, i: number, vars: TabVars): TabDefs {
			if (typeof tab !== 'object' || tab.type !== 'customLink') {
				return super.prepareTabItemDefs(params, tab, i, vars);
			}

			let label = tab.text || '';

			const translateLabel = (label: string): string => {
				if (label.indexOf('$') === 0) {
					return this.translate(label.slice(1), 'navbarTabs') as string;
				}

				return label;
			};

			if (label.indexOf('label@') === 0) {
				label = this.translate(label.substring(6), 'tabs') as string;
			} else {
				label = translateLabel(label);
			}

			const defs: TabDefs = {
				link: tab.link!,
				label: label,
				shortLabel: label.substring(0, 2),
				name: 'custom-link-' + i,
				isInMore: vars.moreIsMet,
				color: tab.color,
				iconClass: tab.iconClass,
				isAfterShowMore: vars.isHidden,
				aClassName: 'nav-custom-link',
				isGroup: false,
			};

			if (defs.isHidden) {
				defs.className = 'after-show-more';
			}

			if (defs.color && !defs.iconClass) {
				defs.colorIconClass = 'color-icon fas fa-square-full';
			}

			return defs;
		}

		addShepherdButton(): void {
			const shepherdButtonId = 'shepherd-button';

			if (document.getElementById(shepherdButtonId)) {
				return;
			}

			const questionMark = $(
				`<li><a id="${shepherdButtonId}" class="btn btn-link"><span class="fas fa-question"></span></a></li>`,
			);
			const globalSearch = this.$el.find('.nav.navbar-nav.navbar-right li.global-search-container');

			if (!globalSearch.length) {
				console.error('Global search element not found');
				return;
			}

			globalSearch.after(questionMark);

			questionMark.on('click', async () => {
				await this.startShepherdTour(this.currentTab, true, true);
			});
		}

		override selectTab(name: string): void {
			super.selectTab(name);

			void this.startShepherdTour(name);
		}

		async startShepherdTour(scope: string, showNotImplemented = false, force = false): Promise<void> {
			switch (scope) {
				case 'Home':
					await this.startShepherdIntro(force);
					return;
			}

			let shepherdPath = this.getMetadata().get(['app', 'shepherd', 'tour', scope]) as string | null;

			if (!shepherdPath) {
				if (showNotImplemented) {
					shepherdPath = 'viacrm:shepherd/not-implemented';
				} else {
					return;
				}
			}

			const Shepherd = await Espo.loader.requirePromise(shepherdPath) as ShepherdClass;

			new Shepherd(this.getHelper()).start(force);
		}

		async startShepherdIntro(force = false): Promise<void> {
			const shepherdPath =
				(this.getMetadata().get(['clientDefs', 'app', 'shepherd', 'intro']) as string) || 'viacrm:shepherd/intro';

			const Shepherd = await Espo.loader.requirePromise(shepherdPath) as ShepherdClass;

			new Shepherd(this.getHelper()).start(force);
		}

		addEditButton(): void {
			const editButtonId = 'edit-navbar-button';

			if (document.getElementById(editButtonId)) {
				return;
			}

			const editNavbarLabel = this.translate('Edit Navbar') as string;

			const editButton = $('<li>')
				.addClass('not-in-more tab')
				.append(
					$('<a>')
						.attr('href', 'javascript:')
						.addClass('nav-link')
						.attr('data-action', 'editNavbar')
						.append(
							$('<span>')
								.addClass('short-label')
								.attr('title', editNavbarLabel)
								.append($('<span>').addClass('fas fa-cog').attr('style', 'color: #36319e')),
						)
						.append($('<span>').addClass('full-label').text(editNavbarLabel)),
				);

			const tabsContainer = this.$el.find('.nav.navbar-nav.tabs');

			if (!tabsContainer.length) {
				console.error('Tabs container not found');
				return;
			}

			tabsContainer.append(editButton);

			editButton.on('click', () => {
				this.actionEditNavbar();
			});
		}

		actionEditNavbar(): void {
			this.createView('modal', 'viacrm:views/modals/edit-navbar', {}, (view: { render(): void }) => {
				view.render();
			});
		}

		async createHistoryTab(): Promise<void> {
			const $navbarRight = this.$el.find('.navbar-right');

			if (!$navbarRight.children('.history-tabs-container').length) {
				$navbarRight.prepend(
					$('<li>', {
						class: 'nav navbar-nav history-tabs-container',
					}),
				);
			}

			const view = await this.createView('historyTabs', this.historyTabsView, {
				selector: '.history-tabs-container',
			}) as HistoryTabsView;

			void view.render();
		}
	},
);
