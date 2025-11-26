import type TimelineView from 'espocrm/src/crm/views/calendar/timeline';

type QuickViewHelper = {
	register(view: unknown, selector: string): void;
};

type QuickViewHelperConstructor = new () => QuickViewHelper;

type RecordModal = {
	showDetail(view: unknown, options: {
		id: string;
		scope: string;
		rootUrl: string | null;
		editDisabled: boolean;
	}): void;
};

type RecordModalConstructor = new (metadata: unknown, acl: unknown) => RecordModal;

type Timeline = {
	body?: unknown;
	destroy(): void;
};

type TimelineData = {
	calendarScopesDisabled: boolean;
	enabledScopes: Array<{
		scope: string;
		color: string;
	}>;
	[key: string]: unknown;
};

type ActionData = {
	id: string;
};

extend<TimelineView>(
	['viacrm:helpers/quick-view-context-menu', 'helpers/record-modal'],
	(Dep, QuickViewHelper: QuickViewHelperConstructor, RecordModal: RecordModalConstructor) => class extends Dep {
		template: string = 'viacrm:calendar/timeline';

		groupScope: string = 'User';
		scopeList: string[] = [];
		enabledScopeList: string[] = [];
		colors: Record<string, string> = {};
		timeline!: Timeline;
		calendarType!: string;

		setup(): void {
			super.setup();

			const colorMap = (this.getConfig().get('calendarColors') || {}) as Record<string, string>;
			const personalColorMap = (this.getPreferences().get('calendarColors') || {}) as Record<string, string>;

			this.scopeList = (this.getConfig().get('calendarEntityList') || []) as string[];
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

		data(): TimelineData {
			const data = super.data() as TimelineData;
			const enabledScopes: Array<{ scope: string; color: string }> = [];

			for (const scope of this.enabledScopeList) {
				enabledScopes.push({
					scope,
					color: this.colors[scope] ?? this.getColorFromScopeName(scope),
				});
			}

			return {
				...data,
				calendarScopesDisabled: this.getConfig().get('calendarScopesDisabled', false) as boolean,
				enabledScopes,
			};
		}

		toggleScopeFilter(name: string): void {
			super.toggleScopeFilter(name);

			if (this.$el.find('div.timeline')) {
				this.reRender();
			}
		}

		fetchEvents(from: string, to: string, callback?: (eventList: unknown[]) => void): void {
			super.fetchEvents(from, to, (eventList: unknown[]) => {
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

		getGroupContent(id: string, name: string): string {
			if (this.calendarType === 'single') {
				return $('<span>').attr('data-id', id).text(name).get(0)!.outerHTML;
			} else {
				let avatarHtml = this.getAvatarHtml(id) as string;
				if (avatarHtml) {
					avatarHtml += ' ';
				}

				return avatarHtml + $('<span>').attr('data-id', id).addClass('group-title').text(name).get(0)!.outerHTML;
			}
		}

		actionQuickView(data: ActionData): void {
			const id = data.id;
			const helper = new RecordModal(this.getMetadata(), this.getAcl());

			helper.showDetail(this, {
				id: id,
				scope: this.groupScope,
				rootUrl: null,
				editDisabled: true,
			});
		}
	}
);
