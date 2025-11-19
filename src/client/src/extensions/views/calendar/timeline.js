extend(['autocrm:helpers/quick-view-context-menu', 'helpers/record-modal'], (Dep, QuickViewHelper, RecordModal) => class extends Dep {
	template = 'autocrm:calendar/timeline';

	groupScope = 'User';
	scopeList = [];
	enabledScopeList = [];
	colors = {};

	setup() {
		super.setup();

		const colorMap = this.getConfig().get('calendarColors') || {};
		const personalColorMap = this.getPreferences().get('calendarColors') || {};

		this.scopeList = this.getConfig().get('calendarEntityList') || [];
		this.scopeList = this.scopeList.filter(scope => this.getAcl().check(scope));

		this.enabledScopeList = this.scopeList.slice();

		this.enabledScopeList.forEach(item => {
			const color = personalColorMap[item] || colorMap[item];

			if (color) {
				this.colors[item] = color;
			}
		});

		new QuickViewHelper().register(this, 'span[data-id]');
	}

	data() {
		const data = super.data();
		const enabledScopes = [];

		for (const scope of this.enabledScopeList) {
			enabledScopes.push({
				scope,
				color: this.colors[scope] ?? this.getColorFromScopeName(scope),
			});
		}

		return {
			...data,
			calendarScopesDisabled: this.getConfig().get('calendarScopesDisabled', false),
			enabledScopes,
		};
	}

	toggleScopeFilter(name) {
		super.toggleScopeFilter(name);

		if (this.$el.find('div.timeline')) {
			this.reRender();
		}
	}

	fetchEvents(from, to, callback) {
		super.fetchEvents(from, to, eventList => {
			if (callback) {
				callback(eventList);
			}

			const destroy = this.timeline.destroy;
			this.timeline.destroy = () => {
				if (this.timeline?.body) {
					// important because of reRender in toggleScopeFilter, do not remove 💀
					destroy.call(this.timeline);
				}
			};
		});
	}

	getGroupContent(id, name) {
		if (this.calendarType === 'single') {
			return $('<span>').attr('data-id', id).text(name).get(0).outerHTML;
		} else {
			let avatarHtml = this.getAvatarHtml(id);
			if (avatarHtml) {
				avatarHtml += ' ';
			}

			return avatarHtml + $('<span>').attr('data-id', id).addClass('group-title').text(name).get(0).outerHTML;
		}
	}

	actionQuickView(data) {
		const id = data.id;
		const helper = new RecordModal(this.getMetadata(), this.getAcl());

		helper.showDetail(this, {
			id: id,
			scope: this.groupScope,
			rootUrl: null,
			editDisabled: true,
		});
	}
});
