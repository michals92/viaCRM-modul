define(['views/email/list'], Dep => class extends Dep {
	template = 'autocrm:email/list';

	searchView = 'autocrm:views/email/record/search';

	MODE_COMBINED = 'combined';

	selectedEmailId = null;

	_dontSkipNextBuildRows = false;

	continueRefresh = false;

	setup() {
		this.defaultFolderId = this.getPreferences().get('defaultEmailFolder') || this.defaultFolderId;
		super.setup();
		this.selectedEmailId = (this.options.params || {}).email;

		this.applyEmail();

		this.on('after:render', () => this.reinitStickables());
		this.on('remove', () => this.removeStickableEmails());

		const autoRefresh = this.getConfig().get('autoEmailRefresh') || false;

		if (autoRefresh) {
			// THis is in seconds
			this.refreshIntervalSeconds = this.getConfig().get('emailCheckInterval') || 60;

			this.fetchEmailsRepeatedly();
		}

		this.listenToOnce(this.getRouter(), 'routed', () => (this.continue = false));

		// Check if user is trying to access "All" folder without permission
		this.checkAllFolderAccess();
	}

	checkAllFolderAccess() {
		if (this.selectedFolderId === 'all' && !this.hasAllFolderPermission()) {
			// Silently change the folder to inbox without triggering router
			this.selectedFolderId = 'inbox';
			this.applyFolder();
			// Update URL without triggering navigation
			this.getRouter().navigate('#Email/list/folder=inbox', {trigger: false, replace: true});
		}
	}

	hasAllFolderPermission() {
		// Admin users always have access
		if (this.getUser()?.isAdmin()) {
			return true;
		}

		// Check ACL permission for All Email Folder
		const acl = this.getAcl();
		if (!acl) return true; // Default to showing if ACL not available

		// Check the specific permission level
		const permissionLevel = acl.getPermissionLevel('allEmailFolder');
		
		// Permission is allowed by default unless explicitly set to "no"
		return permissionLevel !== 'no';
	}

	fetchEmailsRepeatedly() {
		if (!this.continue) {
			return;
		}

		Espo.Ui.notifyWait();

		this.collection.fetch().then(() => Espo.Ui.notify(false));

		setTimeout(
			this.fetchEmailsRepeatedly.bind(this),
			this.refreshIntervalSeconds * 1000, // setTimeout needs milliseconds
		);
	}

	reinitStickables() {
		this.removeStickableEmails();

		$(window).off('resize.email-folders');
		$(window).off('scroll.email-folders');

		this.initStickableEmails();
		this.initStickableFolders();
	}

	data() {
		const data = super.data();
		data.isCombinedMode = this.isCombinedMode();

		return data;
	}

	isCombinedMode() {
		return this.viewMode === this.MODE_COMBINED;
	}

	initStickableEmails() {
		const $window = $(window);
		const $container = this.$el.find('.email-list-container');
		const $list = $container.parent();

		const screenWidthXs = this.getThemeManager().getParam('screenWidthXs');
		const isSmallScreen = $(window.document).width() < screenWidthXs;
		const offset =
				this.getThemeManager().getParam('navbarHeight') +
				(this.getThemeManager().getParam('buttonsContainerHeight') || 47);

		const bottomSpaceHeight = parseInt(window.getComputedStyle($('#content').get(0)).paddingBottom, 10);

		const getOffsetTop = $element => {
			let element = $element.get(0);

			let value = 0;

			while (element) {
				value += !isNaN(element.offsetTop) ? element.offsetTop : 0;

				element = element.offsetParent;
			}

			if (isSmallScreen) {
				return value;
			}

			return value - offset;
		};

		this.stickableTop = getOffsetTop($list);

		const control = () => {
			let start = this.stickableTop;

			if (start === null) {
				start = this.stickableTop = getOffsetTop($list);
			}

			let scrollTop = $window.scrollTop();

			if (!this.isCombinedMode() || scrollTop <= start || isSmallScreen) {
				$container.removeClass('sticked').width('').scrollTop(0);

				$container.css({
					maxHeight: '',
				});

				return;
			}

			if (scrollTop > start) {
				let scroll = $window.scrollTop() - start;

				$container.width($container.outerWidth(true)).addClass('sticked').scrollTop(scroll);

				let topStickPosition = parseInt(window.getComputedStyle($container.get(0)).top);

				let maxHeight = $window.height() - topStickPosition - bottomSpaceHeight;

				$container.css({ maxHeight: maxHeight });
			}
		};

		$window.on('resize.stickable-emails', () => control());
		$window.on('scroll.stickable-emails', () => control());
	}

	removeStickableEmails() {
		$(window).off('resize.stickable-emails');
		$(window).off('scroll.stickable-emails');
	}

	switchViewMode(mode) {
		this.setViewMode(mode, true);

		this._dontSkipNextBuildRows = true;

		this.reRender().then(() => this.loadList());
	}

	prepareRecordViewOptions(o) {
		if (this._dontSkipNextBuildRows) {
			o.skipBuildRows = false;
			this._skipNextBuildRows = false;
		}

		const selectorKey = 'selector' in o ? 'selector' : 'el';

		o[selectorKey] += ' .email-list-container';
	}

	createListRecordView(fetch) {
		return super.createListRecordView(fetch).then(view => {
			view = this.getRecordView();

			this.listenTo(view, 'select', model => {
				this.selectedEmailId = model.id;

				const params = {
					folder: this.getSelectedFolderId(),
					email: this.selectedEmailId,
				};

				this.applyEmail();

				this.applyParamsToUrl(params);
			});
		});
	}

	getSelectedFolderId() {
		return this.selectedFolderId !== this.defaultFolderId ? this.selectedFolderId : null;
	}

	createView(key, viewName, options, callback, wait) {
		return super.createView(
			key,
			viewName,
			options,
			view => {
				if (typeof callback === 'function') {
					callback(view);
				}

				if (key === 'folders') {
					this.stopListening(view, 'select');

					let xhr = null;

					this.listenTo(view, 'select', folderId => {
						// Check permission before allowing selection of "All" folder
						if (folderId === 'all' && !this.hasAllFolderPermission()) {
							// Silently switch to inbox instead
							folderId = 'inbox';
						}

						this.selectedFolderId = folderId;
						this.applyFolder();

						if (xhr && xhr.readyState < 4) {
							xhr.abort();
						}

						Espo.Ui.notifyWait();

						xhr = this.collection.fetch().then(() => Espo.Ui.notify(false));

						const params = {
							folder: this.getSelectedFolderId(),
							email: this.selectedEmailId,
						};

						this.applyParamsToUrl(params);
						this.updateLastUrl();
					});
				}
			},
			wait,
		);
	}

	applyEmail() {
		this.collection.selectedEmailId = this.selectedEmailId;
	}

	applyRoutingParams(params) {
		super.applyRoutingParams(params);

		if ('email' in params) {
			this.getRecordView().lastOpenId = params.email;
		}
	}

	applyParamsToUrl(params) {
		const paramsCloned = _.clone(params);

		_.each(paramsCloned, (value, key) => {
			if (_.isNull(value) || _.isUndefined(value)) {
				delete paramsCloned[key];
			}
		});

		this.getRouter().navigate('#Email/list/' + $.param(paramsCloned), {
			replace: true,
		});
	}
});
