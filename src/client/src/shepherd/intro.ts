import type BaseType from 'autocrm:shepherd/base';

interface ShepherdTour {
	on(event: string, callback: () => void): void;
	start(): void;
	next(): void;
	back(): void;
	complete(): void;
	addStep(options: ShepherdStepOptions): void;
}

interface ShepherdButton {
	text: string;
	action: () => void;
	classes: string;
}

interface ShepherdStepOptions {
	title?: string;
	text?: string;
	buttons?: ShepherdButton[];
	attachTo?: {
		element: string | (() => Element | null);
		on: string;
	};
	arrow?: boolean;
	beforeShowPromise?: () => Promise<void>;
	showOn?: () => boolean;
}

interface ShepherdLib {
	Tour: new (options: Record<string, unknown>) => ShepherdTour;
}

declare const $: JQueryStatic;

define(
	['autocrm:shepherd/base'],
	(Base: typeof BaseType) =>
		// TODO:
		/*

		function handler(e) {
			e.stopPropagation();
			e.preventDefault();
		}

		*/
		class extends Base {
			Shepherd!: ShepherdLib;

			getPreferencesKey(): string {
				return 'disableIntroGuide';
			}

			createTour(): ShepherdTour {
				const tour = new this.Shepherd.Tour({
					useModalOverlay: true,
					defaultStepOptions: {
						cancelIcon: {
							enabled: true,
						},
						classes: 'shepherd-espocrm',
						canClickTarget: false,
						arrow: true,
					},
				});

				const next = this.getNextButton(tour);
				const back = this.getBackButton(tour);

				const openSidebar = (): void => {
					const isMinimized = !!document.querySelector('body.has-navbar.minimized');
					const minimizer = document.querySelector('#navbar a.minimizer') as HTMLElement | null;

					if (isMinimized && minimizer) {
						minimizer.click();
					}
				};

				tour.addStep({
					title: this.translate('Welcome to AutoCRM', 'titles'),
					text: this.translate('Welcome to AutoCRM', 'messages'),
					buttons: [next],
					beforeShowPromise: async () => {
						openSidebar();
					},
				});

				tour.addStep({
					title: this.translate('Entities', 'titles'),
					text: this.translate('Entities', 'messages'),
					attachTo: {
						element: 'header #navbar .navbar',
						on: 'right',
					},
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Home', 'titles'),
					text: this.translate('Home', 'messages'),
					attachTo: {
						element: '#navbar li[data-name="Home"]',
						on: 'right',
					},
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('GlobalSearch', 'titles'),
					text: this.translate('GlobalSearch', 'messages'),
					attachTo: {
						element: '#navbar .global-search-container',
						on: 'bottom',
					},
					buttons: [back, next],
					arrow: false,
				});

				tour.addStep({
					title: this.translate('QuestionMark', 'titles'),
					text: this.translate('QuestionMark', 'messages'),
					attachTo: {
						element: '#navbar li #shepherd-button',
						on: 'bottom',
					},
					buttons: [back, next],
					arrow: false,
				});

				tour.addStep({
					title: this.translate('QuickCreate', 'titles'),
					text: this.translate('QuickCreate', 'messages'),
					attachTo: {
						element: '#navbar li.quick-create-container',
						on: 'bottom',
					},
					buttons: [back, next],
					arrow: false,
				});

				tour.addStep({
					title: this.translate('Notifications', 'titles'),
					text: this.translate('Notifications', 'messages'),
					attachTo: {
						element: '#navbar li.notifications-badge-container',
						on: 'bottom',
					},
					buttons: [back, next],
					arrow: false,
				});

				const menuContainerSelector = '#navbar li.menu-container';
				const openUserMenu = (): void => {
					const el = document.querySelector(menuContainerSelector);

					if (!el) {
						return;
					}

					if (![...el.classList].includes('open')) {
						const openClick = el.querySelector('a.dropdown-toggle') as HTMLElement | null;

						if (openClick) {
							setTimeout(() => openClick.click(), 0);
						}
					}
				};

				tour.addStep({
					title: this.translate('Settings', 'titles'),
					text: this.translate('Settings', 'messages'),
					attachTo: {
						element: `${menuContainerSelector} ul.dropdown-menu`,
						on: 'left-start',
					},
					buttons: [back, next],
					arrow: false,
					beforeShowPromise: async () => {
						openUserMenu();
					},
				});

				const attachToIfAvailable = (element: string | (() => Element | null), on: string): Partial<ShepherdStepOptions> => ({
					showOn(): boolean {
						const $el = $(typeof element === 'function' ? element() : element);

						return $el.length > 0 && $el.is(':visible');
					},
					attachTo: {element, on},
				});

				tour.addStep({
					title: this.translate('Mattermost', 'titles'),
					text: this.translate('Mattermost', 'messages'),
					...attachToIfAvailable('#navbar li[data-name="Chat"]', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Emails', 'titles'),
					text: this.translate('Emails', 'messages'),
					...attachToIfAvailable('#navbar li[data-name="Email"]', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Calendar', 'titles'),
					text: this.translate('Calendar', 'messages'),
					...attachToIfAvailable('#navbar li[data-name="Calendar"]', 'right'),
					buttons: [back, next],
				});

				const getSidebarGroupElement = (textContent: string): HTMLElement | null => {
					const labelSelector = '#navbar li span.full-label';
					const element = $(
						[...document.querySelectorAll(labelSelector)].find(el => el.textContent === textContent),
					)
						.closest('li.tab')
						.get(0) as HTMLElement | undefined;

					return element || null;
				};

				const getSubmenuElement = (sidebar: string, name: string): HTMLElement | null => {
					const menu = getSidebarGroupElement(sidebar)?.querySelector(`li[data-name='${name}'].in-group.tab`) as HTMLElement | null;

					return menu || null;
				};

				const openSubmenu = async (name: string): Promise<void> => new Promise(resolve => {
					setTimeout(() => {
						const business = getSidebarGroupElement(name);

						if (!business) {
							resolve();
							return;
						}

						if (business.classList.contains('open')) {
							resolve();
							return;
						}

						const businessClickable = business.querySelector('a') as HTMLElement | null;

						if (!businessClickable) {
							throw new Error(`No clickable element found for submenu ${name}!`);
						}

						businessClickable.click();
						resolve();
					}, 0);
				});

				tour.addStep({
					title: this.translate('Business', 'titles'),
					text: this.translate('Business', 'messages'),
					...attachToIfAvailable(() => getSidebarGroupElement('Business'), 'right'),
					buttons: [back, next],
				});

				const attachToSubmenu = (sidebar: string, name: string, on: string): Partial<ShepherdStepOptions> => ({
					showOn(): boolean {
						return getSidebarGroupElement(sidebar) !== null && getSubmenuElement(sidebar, name) !== null;
					},
					attachTo: {
						element: () => getSubmenuElement(sidebar, name),
						on,
					},
					beforeShowPromise: async () => openSubmenu(sidebar),
				});

				tour.addStep({
					title: this.translate('Leads', 'titles'),
					text: this.translate('Leads', 'messages'),
					...attachToSubmenu('Business', 'Lead', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Accounts', 'titles'),
					text: this.translate('Accounts', 'messages'),
					...attachToSubmenu('Business', 'Account', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Contacts', 'titles'),
					text: this.translate('Contacts', 'messages'),
					...attachToSubmenu('Business', 'Contact', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Opportunities', 'titles'),
					text: this.translate('Opportunities', 'messages'),
					...attachToSubmenu('Business', 'Opportunity', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Quotes', 'titles'),
					text: this.translate('Quotes', 'messages'),
					...attachToSubmenu('Business', 'Quote', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('SalesOrders', 'titles'),
					text: this.translate('SalesOrders', 'messages'),
					...attachToSubmenu('Business', 'SalesOrder', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('IssuedOrders', 'titles'),
					text: this.translate('IssuedOrders', 'messages'),
					...attachToSubmenu('Business', 'IssuedOrder', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('ProjectManagement', 'titles'),
					text: this.translate('ProjectManagement', 'messages'),
					...attachToIfAvailable(() => getSidebarGroupElement('Projektmanagement'), 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Invoices', 'titles'),
					text: this.translate('Invoices', 'messages'),
					...attachToIfAvailable(() => getSidebarGroupElement('Erstellte Rechnungen'), 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('WarehouseManagement', 'titles'),
					text: this.translate('WarehouseManagement', 'messages'),
					...attachToIfAvailable('#navbar li[data-name="Warehouse"]', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Campaigns', 'titles'),
					text: this.translate('Campaigns', 'messages'),
					...attachToIfAvailable('#navbar li[data-name="Campaign"]', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('Reporting', 'titles'),
					text: this.translate('Reporting', 'messages'),
					...attachToIfAvailable('#navbar li[data-name="Report"]', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('KnowledgeBaseArticles', 'titles'),
					text: this.translate('KnowledgeBaseArticles', 'messages'),
					...attachToIfAvailable('#navbar li[data-name="KnowledgeBaseArticle"]', 'right'),
					buttons: [back, next],
				});

				tour.addStep({
					title: this.translate('DashboardAndDashlets', 'titles'),
					text: this.translate('DashboardAndDashlets', 'messages').replace(
						'{{dashboard_video}}',
						"<a href='https://youtu.be/00v1vAWBYPU'>link</a>",
					),
					buttons: [back, this.getFinishButton(tour)],
					arrow: false,
				});

				return tour;
			}
		},
);
