extend(['autocrm:helpers/version'], (Dep) => class extends Dep {
	setup() {
		super.setup();

		this.wait(
			Espo.loader.requirePromise('gridstack').then(gs => this.GridStack = gs),
		);
	}

	initGridstack() {
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
				margin: this.getThemeManager().getParam('dashboardCellMargin') / 2,
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
			$gridstack.get(0),
		));

		grid.removeAll();

		this.currentTabLayout.forEach(o => {
			let $item = this.prepareGridstackItem(o.id, o.name);

			if (!this.getMetadata().get(['dashlets', o.name])) {
				return;
			}

			grid.addWidget($item.get(0), {
				x: o.x * this.WIDTH_MULTIPLIER,
				y: o.y,
				w: o.width * this.WIDTH_MULTIPLIER,
				h: o.collapsed === true ? 1 : o.height,
				sizeToContent: true,
			});

			grid.resizable($item.get(0), o.collapsed !== true);
			$item.attr('gs-real-height', o.height);
		});

		$gridstack.find('.grid-stack-item').css('position', 'absolute');

		this.currentTabLayout.forEach(o => {
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
		this.grid.on('resizestop', (e, el) => {
			el.setAttribute('gs-real-height', el.getAttribute('gs-h'));

			let id = $(e.target).data('id');
			let view = this.getView('dashlet-' + id);

			if (!view) {
				return;
			}
			view.trigger('resize');
		});
	}

	createDashletView(id, name, label, callback) {
		if (!this.getPreferences().get('collapsibleDashlets')) {
			super.createDashletView(id, name, label, callback);
			return;
		}

		let o = {
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
				collapsed: this.currentTabLayout.find(dashlet => dashlet.id === id)?.collapsed,
			},
			view => {
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

	addDashlet(name) {
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

		let $item = this.prepareGridstackItem(id, name);

		this.grid.addWidget($item.get(0), {
			x: 0,
			y: 0,
			w: 2 * this.WIDTH_MULTIPLIER,
			h: 2,
		});

		this.createDashletView(id, name, name, view => {
			let $new = this.$gridstack.find(`.grid-stack-item[data-id="${id}"]`);

			$new.attr('gs-real-height', 2 * this.WIDTH_MULTIPLIER);

			this.fetchLayout();
			this.saveLayout();

			this.setupCurrentTabLayout();

			if (view.getView('body') && view.getView('body').afterAdding) {
				view.getView('body').afterAdding.call(view.getView('body'));
			}

			if (revertToFallback) {
				this.initFallbackMode();
			}
		});
	}

	getCellHeight() {
		if (this.getPreferences().get('collapsibleDashlets')) {
			return (
				window
					.getComputedStyle(document.documentElement)
					.getPropertyValue('--panel-heading-height')
					.replace('px', '') * 1.55
			);
		} else {
			return this.getThemeManager().getParam('dashboardCellHeight') * 1.14;
		}
	}

	fetchLayout() {
		if (!this.getPreferences().get('collapsibleDashlets')) {
			super.fetchLayout();
			return;
		}

		this.dashboardLayout[this.currentTab].layout = _.map(this.$gridstack.find('.grid-stack-item'), el => {
			let $el = $(el);

			const id = $el.data('id');

			let collapsed = false;

			const dashlet = this.currentTabLayout.find(d => d.id === id);

			if (dashlet) {
				collapsed = dashlet.collapsed ?? false;
			}

			let x = $el.attr('gs-x');
			let y = $el.attr('gs-y');
			let height = $el.attr('gs-real-height');
			let w = $el.attr('gs-w');

			return {
				id,
				name: $el.data('name'),
				x: x / this.WIDTH_MULTIPLIER,
				y,
				width: w / this.WIDTH_MULTIPLIER,
				height,
				collapsed,
			};
		});
	}
});
