define(['autocrm:shepherd/base'], Base => 
// TODO:
	/*

	function handler(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	*/
	class extends Base {
		getPreferencesKey() {
			return 'disableIntroGuide';
		}

		createTour() {
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

			const openSidebar = () => {
				const isMinimized = !!document.querySelector('body.has-navbar.minimized');
				const minimizer = document.querySelector('#navbar a.minimizer');

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
			const openUserMenu = () => {
				const el = document.querySelector(menuContainerSelector);

				if (!el) {
					return;
				}

				if (![...el.classList].includes('open')) {
					const openClick = el.querySelector('a.dropdown-toggle');

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

			const attachToIfAvailable = (element, on) => ({
				showOn() {
					const $el = $(typeof element === 'function' ? element() : element);

					return $el.length && $el.is(':visible');
				},
				attachTo: { element, on },
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

			const getSidebarGroupElement = textContent => {
				const labelSelector = '#navbar li span.full-label';
				const element = $(
					[...document.querySelectorAll(labelSelector)].find(el => el.textContent === textContent),
				)
					.closest('li.tab')
					.get(0);

				return element || null;
			};

			const getSubmenuElement = (sidebar, name) => {
				const menu = getSidebarGroupElement(sidebar)?.querySelector(`li[data-name='${name}'].in-group.tab`);

				return menu || null;
			};

			const openSubmenu = async name => new Promise(resolve => {
				setTimeout(() => {
					const business = getSidebarGroupElement(name);

					if (business.classList.contains('open')) {
						return;
					}

					const businessClickable = business.querySelector('a');

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

			const attachToSubmenu = (sidebar, name, on) => ({
				showOn() {
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
	}
);
