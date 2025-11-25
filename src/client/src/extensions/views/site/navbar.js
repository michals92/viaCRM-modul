extend(['viacrm:helpers/logo'], (Dep, LogoHelper) => class extends Dep {
	emailCheckInterval = 60;
	historyTabsView = 'viacrm:views/site/history-tabs';

	setup() {
		super.setup();

		this.useWebSocket = this.getConfig().get('useWebSocket');
		this.emailCheckInterval = this.getConfig().get('emailCheckInterval') || this.emailCheckInterval;
		this.lastController = null;

		this.getRouter().on('routed', e => {
			if ((e.controller === 'Email' && e.action === 'view') || this.lastController === 'Email') {
				this.runCheckNewEmails();
			}

			this.lastController = e.controller;
		});
	}

	// Overriden to replace the default logo with AutoERP logo
	getLogoSrc() {
		const logoHelper = new LogoHelper(this.getConfig(), this.getHelper(), this.getThemeManager());

		return logoHelper.getLogoSrc();
	}

	isViewingAs() {
		return document.cookie.indexOf('view-as-user-id') > -1;
	}

	setupMenu() {
		super.setupMenu();

		if (this.isViewingAs()) {
			const logoutItem = this.menuDataList.find(item => item.name === 'logout');

			if (logoutItem) {
				logoutItem.label = this.translate('Return to My Account');
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
	actionLogout() {
		if (!this.isViewingAs()) {
			super.actionLogout();
			return;
		}

		document.cookie = 'view-as-user-id=; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';

		Espo.Ajax.postRequest('Admin/clearCache').then(() => {
			setTimeout(() => window.location.reload(), 1);
		});
	}

	afterRender() {
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

	setupEmailCountBadge() {
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

	runCheckNewEmails() {
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

	checkNewEmails() {
		Espo.Ajax.getRequest('Email/inbox/notReadCounts').then(data => {
			const count = data.inbox || 0;

			this.$emailCountBadge.text(count > 99 ? '99+' : count);
			this.$emailCountBadge.toggle(count > 0);
		});
	}

	prepareTabCustomLinks() {
		this.$el.find('ul.nav li a.nav-custom-link:not([href^="#"])').attr('target', '_blank');
	}

	filterTabItem(tab) {
		const original = super.filterTabItem?.(tab) || this.tabsHelper?.checkTabAccess?.(tab);
		return original || (typeof tab === 'object' && tab.type === 'customLink' && tab.link);
	}

	setupTabDefsList() {
		const tabList = this.getTabList().filter(item => {
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

	prepareTabItemDefs(params, tab, i, vars) {
		if (typeof tab !== 'object' || tab.type !== 'customLink') {
			return super.prepareTabItemDefs(params, tab, i, vars);
		}

		let label = tab.text || '';

		const translateLabel = label => {
			if (label.indexOf('$') === 0) {
				return this.translate(label.slice(1), 'navbarTabs');
			}

			return label;
		};

		if (label.indexOf('label@') === 0) {
			label = this.translate(label.substring(6), 'tabs');
		} else {
			label = translateLabel(label);
		}

		const defs = {
			link: tab.link,
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

	addShepherdButton() {
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

	selectTab(name) {
		super.selectTab(name);

		void this.startShepherdTour(name);
	}

	async startShepherdTour(scope, showNotImplemented = false, force = false) {
		switch (scope) {
			case 'Home':
				await this.startShepherdIntro(force);
				return;
		}

		let shepherdPath = this.getMetadata().get(['app', 'shepherd', 'tour', scope]);

		if (!shepherdPath) {
			if (showNotImplemented) {
				shepherdPath = 'viacrm:shepherd/not-implemented';
			} else {
				return;
			}
		}

		const Shepherd = await Espo.loader.requirePromise(shepherdPath);

		new Shepherd(this.getHelper()).start(force);
	}

	async startShepherdIntro(force = false) {
		const shepherdPath =
				this.getMetadata().get(['clientDefs', 'app', 'shepherd', 'intro']) || 'viacrm:shepherd/intro';

		const Shepherd = await Espo.loader.requirePromise(shepherdPath);

		new Shepherd(this.getHelper()).start(force);
	}

	addEditButton() {
		const editButtonId = 'edit-navbar-button';

		if (document.getElementById(editButtonId)) {
			return;
		}

		const editNavbarLabel = this.translate('Edit Navbar');

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

	actionEditNavbar() {
		this.createView('modal', 'viacrm:views/modals/edit-navbar', {}, view => {
			view.render();
		});
	}

	async createHistoryTab() {
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
		});

		void view.render();
	}
});
