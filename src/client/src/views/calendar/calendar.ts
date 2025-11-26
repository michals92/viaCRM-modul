import type {SelectModule} from 'espocrm/src/ui/select';

interface UserInfo {
	id: string;
	name: string;
}

interface CalendarColors {
	[scope: string]: string;
}

interface HolidayItem {
	date: string;
	holidayName: string;
}

interface CalendarEvent {
	id: string;
	title: string;
	start: Date | null;
	end?: Date | null;
	allDay?: boolean;
	scope: string;
	recordId: string;
	color?: string;
	attributes?: Record<string, unknown>;
	extendedProps: {
		scope?: string;
		id?: string;
		allDayCopy?: boolean;
		attributes?: {
			iconClass?: string;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	_def: {
		publicId: string;
	};
}

interface FcEventArg {
	event: CalendarEvent;
}

interface DayCellArg {
	date: Date;
	dayNumberText: string;
}

interface CalendarOptions {
	date?: string | null;
	mode?: string;
	header?: boolean;
	scrollToNowSlots?: boolean;
	$container?: JQuery;
	userId?: string;
	userName?: string;
	suppressLoadingAlert?: boolean;
	enabledScopeList?: string[];
	slotDuration?: number;
}

interface LayoutItem {
	[key: string]: unknown;
}

interface CalendarItemView {
	getHtml(callback: (html: string) => void): void;
	_html?: string;
}

interface ModeButtonsView {
	render(): void;
}

interface FullCalendarInstance {
	refetchEvents(): void;
	render(): void;
	view: {
		type: string;
		currentStart: Date;
		currentEnd: Date;
	};
}

interface FullCalendarModule {
	Calendar: new (el: HTMLElement, options: Record<string, unknown>) => FullCalendarInstance;
}

// CRM Calendar base view - no type available
interface CrmCalendarView {
	template: string;
	colors: CalendarColors;
	modeList: string[];
	scopeList: string[];
	allDayScopeList: string[];
	slotDuration: number;
	enabledScopeList: string[];
	header: boolean;
	scrollToNowSlots: boolean;
	defaultMode: string;
	calendar: FullCalendarInstance;
	titleFormat: Record<string, string>;
	rangeSeparator: string;
	onlyDateScopeList: string[];
	options: CalendarOptions;
	$el: JQuery;

	data(): Record<string, unknown>;
	setup(): void;
	afterRender(): void;
	toggleScopeFilter(name: string): void;
	setupMode(): void;
	setupScrollHour(): void;
	getStoredEnabledScopeList(): string[] | null;
	convertToFcEvent(o: CalendarEvent): CalendarEvent;
	fetchEvents(from: string, to: string, callback: (events: CalendarEvent[]) => void): void;
	getTitle(): string;
	dateToMoment(date: Date): {format(fmt: string): string; subtract(n: number, unit: string): {format(fmt: string): string}};
	reRender(): void;
	wait(promise: Promise<unknown>): void;
	createView(key: string, viewName: string, options: Record<string, unknown>, callback?: (view: unknown) => void): void;
	getView(key: string): unknown;
	listenTo(obj: unknown, event: string, callback: (...args: unknown[]) => void): void;

	getHelper(): {
		getAppParam(name: string): unknown;
		escapeString(str: string): string;
		layoutManager: {get(scope: string, type: string, callback: (layout: LayoutItem[]) => void): void};
		themeManager: {getParam(name: string): unknown};
	};
	getConfig(): {get(key: string, defaultValue?: unknown): unknown};
	getPreferences(): {get(key: string): unknown};
	getMetadata(): {get(path: string | string[], defaultValue?: unknown): unknown};
	getStorage(): {get(type: string, key: string): unknown; set(type: string, key: string, value: unknown): void};
	getAcl(): {check(scope: string): boolean; getPermissionLevel(name: string): string};
	getRouter(): {navigate(url: string, options: {trigger: boolean}): void};
	getModelFactory(): {create(scope: string, callback: (model: {name: string; id: string; set(attrs: Record<string, unknown>): void}) => void): void};
	getUser(): {get(key: string): unknown};
	getColorFromScopeName(scope: string): string;
}

define(
	['crm:views/calendar/calendar', 'ui/select', 'fullcalendar'],
	(Dep: new () => CrmCalendarView, Select: SelectModule, FullCalendar: FullCalendarModule) => class extends Dep {
		override template = 'autocrm:calendar/calendar';

		layoutMap: Record<string, LayoutItem[]> = {};
		viewMap: Record<string, CalendarItemView> = {};

		publicHolidays: Record<string, string> = {};

		// Default to hiding all-day events initially (can be overridden by storage)
		allDayDisabled = false;

		isCustomViewAvailable = false;
		suppressLoadingAlert = false;
		date: string | null = null;
		mode = '';
		$container?: JQuery;

		override data(): Record<string, unknown> {
			const data = super.data();

			const userList = ((this.getHelper().getAppParam('userList') || []) as UserInfo[]).sort((u1, u2) =>
				u1.name.localeCompare(u2.name),
			);

			const userNameMap: Record<string, string> = {};

			userList.forEach(user => {
				userNameMap[user.id] = user.name;
			});

			const userIds = userList.map(user => user.id);

			const enabledScopes: {scope: string; color: string}[] = [];

			for (const scope of this.enabledScopeList) {
				enabledScopes.push({
					scope,
					color: this.colors[scope] ?? this.getColorFromScopeName(scope),
				});
			}

			return {
				...data,
				userList,
				userIds,
				userNameMap,
				enabledScopes,
				calendarScopesDisabled: this.getConfig().get('calendarScopesDisabled', false),
				selectedUser: this.options.userId || this.getUser().get('id'),
			};
		}

		override toggleScopeFilter(name: string): void {
			super.toggleScopeFilter(name);
			this.reRender();
		}

		override setup(): void {
			this.wait(Espo.loader.requirePromise('lib!@fullcalendar/moment'));
			this.wait(Espo.loader.requirePromise('lib!@fullcalendar/moment-timezone'));

			this.suppressLoadingAlert = this.options.suppressLoadingAlert ?? false;

			this.date = this.options.date || null;
			this.mode = this.options.mode || this.defaultMode;
			this.header = 'header' in this.options ? this.options.header! : this.header;

			this.scrollToNowSlots =
				this.options.scrollToNowSlots !== undefined ? this.options.scrollToNowSlots : this.scrollToNowSlots;

			// Get the allDayDisabled state from localStorage, default to false if not set
			const storedDisabled = this.getStorage().get('state', 'calendarAllDayDisabled') as boolean | null;
			// Default to false (meaning all-day events are shown by default) if nothing is stored
			this.allDayDisabled = storedDisabled !== null ? storedDisabled : false;

			// Ensure the value is stored in localStorage
			this.getStorage().set('state', 'calendarAllDayDisabled', this.allDayDisabled);

			this.setupMode();

			this.$container = this.options.$container;

			this.colors = Espo.Utils.clone(this.getMetadata().get('clientDefs.Calendar.colors') || this.colors) as CalendarColors;

			this.modeList = (this.getMetadata().get('clientDefs.Calendar.modeList') || this.modeList) as string[];

			this.scopeList = (this.getConfig().get('calendarEntityList') || Espo.Utils.clone(this.scopeList)) as string[];

			this.allDayScopeList =
				(this.getConfig().get('calendarAllDayScopeList') ||
				this.getMetadata().get('clientDefs.Calendar.allDayScopeList') ||
				[]) as string[];

			// Added in EspoCRM 9.2.0
			this.scopeList.forEach(scope => {
				if (this.getMetadata().get(`scopes.${scope}.calendarOneDay`) && !this.allDayScopeList.includes(scope)) {
					this.allDayScopeList.push(scope);
				}
			});

			this.slotDuration =
				(this.options.slotDuration ||
				this.getPreferences().get('calendarSlotDuration') ||
				this.getMetadata().get('clientDefs.Calendar.slotDuration') ||
				this.slotDuration) as number;

			this.setupScrollHour();

			this.colors = {...this.colors, ...(this.getHelper().themeManager.getParam('calendarColors') as CalendarColors || {})};

			this.isCustomViewAvailable = this.getAcl().getPermissionLevel('userPermission') !== 'no';

			if (this.options.userId) {
				this.isCustomViewAvailable = false;
			}

			const scopeList: string[] = [];

			this.scopeList.forEach(scope => {
				if (this.getAcl().check(scope)) {
					scopeList.push(scope);
				}
			});

			this.scopeList = scopeList;

			// Added in EspoCRM 9.2.0
			this.onlyDateScopeList = this.scopeList.filter(scope => this.getMetadata().get(`entityDefs.${scope}.fields.dateStart.type`) === 'date');

			if (this.header) {
				this.enabledScopeList = this.getStoredEnabledScopeList() || Espo.Utils.clone(this.scopeList) as string[];
			} else {
				this.enabledScopeList = this.options.enabledScopeList || Espo.Utils.clone(this.scopeList) as string[];
			}

			if (Object.prototype.toString.call(this.enabledScopeList) !== '[object Array]') {
				this.enabledScopeList = [];
			}

			this.enabledScopeList.forEach(item => {
				const color = this.getMetadata().get(['clientDefs', item, 'color']) as string | null;

				if (color) {
					this.colors[item] = color;
				}
			});

			if (this.header) {
				this.createView('modeButtons', 'crm:views/calendar/mode-buttons', {
					selector: '.mode-buttons',
					isCustomViewAvailable: true, //don't make the 'Create Shared View' button disappear upon changing a user
					modeList: this.modeList,
					scopeList: this.scopeList,
					mode: this.mode,
					// Pass the disabled state to the button view
					allDayDisabled: this.allDayDisabled,
				});

				// Listen for the toggle-all-day event from the mode buttons view
				// Assume the event passes the *new disabled state*
				this.listenTo(this.getView('modeButtons') as ModeButtonsView, 'toggle-all-day', (disabled: boolean) => {
					this.allDayDisabled = disabled;
					// Store the new disabled state
					this.getStorage().set('state', 'calendarAllDayDisabled', this.allDayDisabled);
					if (this.calendar) {
						this.calendar.refetchEvents();
					}
				});
			}

			const colorMap = (this.getConfig().get('calendarColors') || {}) as CalendarColors;
			const personalColorMap = (this.getPreferences().get('calendarColors') || {}) as CalendarColors;

			this.enabledScopeList.forEach(item => {
				const color = personalColorMap[item] || colorMap[item];

				if (color) {
					this.colors[item] = color;
				}
			});
		}

		override afterRender(): void {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const calendarView = this;

			const useLayoutsInCalendar = this.getConfig().get('useLayoutsInCalendar') ?? false;

			const OriginalCalendar = FullCalendar.Calendar;

			FullCalendar.Calendar = class extends OriginalCalendar {
				constructor(el: HTMLElement, options: Record<string, unknown>) {
					options.eventMaxStack =
						calendarView.getPreferences().get('calendarMaxEventStack') ||
						calendarView.getConfig().get('calendarMaxEventStack') ||
						5;
					// For shared views, eventContent is set, so don't override it
					if (!options.eventContent) {
						if (useLayoutsInCalendar) {
							options.eventContent = (arg: FcEventArg) => {
								const event = arg.event;
								const scope = event.extendedProps['scope'];
								const id = event.extendedProps['id'];

								// Handle new events or events without a view
								if (!calendarView.viewMap[event._def.publicId]) {
									const $content = $('<div>')
										.attr('data-scope', scope ?? '')
										.attr('data-id', id ?? '')
										.css({
											'padding': '4px 6px',
											'min-height': '44px',
											'display': 'flex',
											'flex-direction': 'column',
											'height': '100%'
										})
										.text(event.title);

									if (event.extendedProps?.attributes?.iconClass) {
										$content.prepend(
											$('<i>')
												.addClass(event.extendedProps.attributes.iconClass)
												.css({
													'margin-right': '5px',
													'margin-left': '2px',
													'margin-top': '2px'
												})
										);
									}

									return {domNodes: [$content[0]]};
								}

								const view = calendarView.viewMap[event._def.publicId];

								const $wrapper = $('<div>')
									.css({
										'padding': '4px 6px',
										'min-height': '44px',
										'display': 'flex',
										'flex-direction': 'column',
										'height': '100%'
									})
									.html(view._html ?? '');

								return {html: $wrapper[0].outerHTML};
							};
						} else {
							options.eventContent = (arg: FcEventArg) => {
								const event = arg.event;
								const scope = event.extendedProps['scope'];
								const iconClass = event.extendedProps?.attributes?.iconClass ||
									calendarView.getMetadata().get(['clientDefs', scope, 'iconClass'], null) as string | null;
								const date = event.start;
								const fontSize = (calendarView.getConfig().get('calendarFontSize') || 12) as number;

								if (event.extendedProps['allDayCopy'] || !date) {
									const $content = $('<div>')
										.css({
											'padding': '4px 6px',
											'min-height': '44px',
											'display': 'flex',
											'flex-direction': 'column',
											'height': '100%'
										})
										.text(event.title);

									if (iconClass) {
										$content.prepend(
											$('<i>')
												.addClass(iconClass)
												.css({
													'margin-right': '5px',
													'margin-left': '2px',
													'margin-top': '2px'
												})
										);
									}

									return {html: $content[0].outerHTML};
								}

								const hours = String(date.getHours()).padStart(2, '0');
								const minutes = String(date.getMinutes()).padStart(2, '0');
								let timeText = `${hours}:${minutes}`;

								if (event.end) {
									const endDate = event.end;
									const endHours = String(endDate.getHours()).padStart(2, '0');
									const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
									timeText += ` - ${endHours}:${endMinutes}`;
								}

								const $wrapper = $('<div>')
									.css({
										'padding': '2px 3px',
										'display': 'flex',
										'align-items': 'center',
										'height': '100%',
										'font-size': `${fontSize}px`,
										'gap': '5px'
									});

								if (iconClass && !calendarView.isMobile()) {
									$wrapper.append(
										$('<i>')
											.addClass(iconClass)
											.css({
												'flex-shrink': '0'
											})
									);
								}

								const $time = $('<span>')
									.css({
										'font-weight': '500',
										'opacity': '0.7',
										'white-space': 'nowrap',
										'flex-shrink': '0'
									})
									.text(timeText);

								const $title = $('<span>')
									.css({
										'flex': '1',
										'overflow': 'hidden',
										'text-overflow': 'ellipsis',
										'white-space': 'nowrap'
									})
									.text(event.title);

								$wrapper.append($time).append($title);

								return {html: $wrapper[0].outerHTML};
							};
						}
					}
					options.dayCellClassNames = (arg: DayCellArg) => {
						const publicHolidays = calendarView.publicHolidays || {};
						const dateStr = arg.date.toLocaleDateString('en-CA'); //toISOString() converts timezone to UTC date, we probably do not want that
						if (publicHolidays[dateStr]) {
							return ['public-holiday'];
						}

						return [];
					};
					options.dayCellContent = (arg: DayCellArg) => {
						const dayNumberEl = document.createElement('i');
						dayNumberEl.innerHTML = arg.dayNumberText;

						const publicHolidays = calendarView.publicHolidays || {};
						const dateStr = arg.date.toLocaleDateString('en-CA');

						if (publicHolidays[dateStr]) {
							const holidayNameEl = document.createElement('span');
							holidayNameEl.classList.add('fc-holiday-name');
							holidayNameEl.innerHTML = publicHolidays[dateStr];
							holidayNameEl.style.marginRight = '0.3rem';
							holidayNameEl.style.fontWeight = 'bolder';
							return {
								domNodes: [holidayNameEl, dayNumberEl],
							};
						}

						return {domNodes: [dayNumberEl]};
					};
					super(el, options);
				}
			};

			this.fetchHolidays().then(holidays => {
				this.publicHolidays = holidays.reduce((result: Record<string, string>, item: HolidayItem) => {
					result[item.date] = item.holidayName;
					return result;
				}, {});
				this.calendar.render();
			});

			super.afterRender();

			const $select = this.$el.find('.calendar-user-switch > select');

			Select.init($select, {
				matchAnyWord: true,
			});

			$select.on('change', () => {
				const selectedId = $select.val() as string;

				const userList = (this.getHelper().getAppParam('userList') || []) as UserInfo[];

				const userName = userList.find(user => user.id === selectedId)?.name || '';

				this.getRouter().navigate(`#Calendar/show/userId=${selectedId}&userName=${userName}`, {
					trigger: true,
				});
			});
		}

		async fetchHolidays(): Promise<HolidayItem[]> {
			return new Promise((resolve, reject) => {
				Espo.Ajax.getRequest(`Holiday/api/${this.getCurrentMonthYear()}?publicOnly=true`)
					.then((response: {total?: number; list?: HolidayItem[]}) => {
						if (response && response?.total && response.total > 0 && response.list) {
							resolve(response.list);
						} else {
							reject(new Error('Invalid holiday data format'));
						}
					})
					.catch((error: Error) => {
						console.error('Error fetching holiday data:', error);
						reject(error);
					});
			});
		}

		getCurrentMonthYear(): string {
			const now = new Date();
			const year = now.getFullYear();
			const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Add 1 because months are 0-indexed
			return `${year}/${month}`;
		}

		isMobile(): boolean {
			if ((navigator as Navigator & {userAgentData?: {mobile?: boolean}}).userAgentData?.mobile !== undefined) {
				return (navigator as Navigator & {userAgentData?: {mobile?: boolean}}).userAgentData!.mobile!;
			}

			// Fallback to traditional user agent string check
			return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		}

		override convertToFcEvent(o: CalendarEvent): CalendarEvent {
			const event = super.convertToFcEvent(o);

			event.extendedProps = event.extendedProps || {};
			event.extendedProps['attributes'] = o.attributes || {};

			return event;
		}

		/**
		 * @private
		 */
		override fetchEvents(from: string, to: string, callback: (events: CalendarEvent[]) => void): void {
			const useLayoutsInCalendar = this.getConfig().get('useLayoutsInCalendar') ?? false;

			if (!useLayoutsInCalendar) {
				super.fetchEvents(from, to, (events: CalendarEvent[]) => {
					// Filter out all-day events if allDayDisabled is true
					let filteredEvents = events;
					if (this.allDayDisabled) {
						filteredEvents = this.filterAllDayEvents(events);
					}

					if (callback) {
						callback(filteredEvents);
					}
				});
				return;
			}

			const fetchedScopes = new Set<string>();
			const layoutPromises: Promise<void>[] = [];

			super.fetchEvents(from, to, (events: CalendarEvent[]) => {
				// Filter out all-day events if allDayDisabled is true
				let filteredEvents = events;
				if (this.allDayDisabled) {
					filteredEvents = this.filterAllDayEvents(events);
				}

				// First, collect all the unique scopes and initiate layout fetches
				for (const event of filteredEvents) {
					if (!event.scope) {
						continue;
					}

					const scope = event.scope;

					// Fetch layout per scope (once per scope)
					if (!fetchedScopes.has(scope)) {
						const layoutPromise = new Promise<void>(resolve => {
							this.getHelper().layoutManager.get(scope, 'calendar', (layout: LayoutItem[]) => {
								this.layoutMap[scope] = layout;
								resolve();
							});
						});
						layoutPromises.push(layoutPromise);
						fetchedScopes.add(scope);
					}
				}

				// Wait until all layouts have been fetched
				Promise.all(layoutPromises).then(() => {
					const viewPromises: Promise<void>[] = [];

					// Now proceed to create the views using the fetched layouts
					for (const event of filteredEvents) {
						if (!event.scope) {
							continue;
						}

						const scope = event.scope;
						const id = event.recordId;

						// Create view and get HTML per event
						const viewPromise = new Promise<void>(resolve => {
							this.getModelFactory().create(scope, model => {
								// Set model attributes
								model.name = scope;
								model.id = id;
								model.set(event.extendedProps.attributes ?? {});

								this.createView(
									`${scope}-${id}`,
									'autocrm:views/calendar/calendar-item',
									{
										model,
										itemLayout: this.layoutMap[scope],
										rowActionsDisabled: true,
										eventColor: event.color,
									},
									(view: CalendarItemView) => {
										view.getHtml((html: string) => {
											view._html = html;
											this.viewMap[event.id] = view;
											resolve();
										});
									},
								);
							});
						});
						viewPromises.push(viewPromise);
					}

					// Wait until all views have been created and HTML retrieved
					Promise.all(viewPromises).then(() => {
						callback(filteredEvents);
					});
				});
			});
		}

		// Helper method to filter out all-day events
		filterAllDayEvents(events: CalendarEvent[]): CalendarEvent[] {
			if (!events || !Array.isArray(events)) {
				return events;
			}

			return events.filter(event => {
				// Check if the event is from a scope in the allDayScopeList
				if (this.allDayScopeList && this.allDayScopeList.includes(event.scope)) {
					return false;
				}

				// Check if the event is marked as an all-day event
				if (event.allDay) {
					return false;
				}

				return true;
			});
		}

		// This method is overridden to display the proper month in month view, the original EspoCRM code has a bug
		// See https://github.com/espocrm/espocrm/issues/3277
		override getTitle(): string {
			const view = this.calendar.view;

			const map: Record<string, string> = {
				timeGridWeek: 'week',
				timeGridDay: 'day',
				dayGridWeek: 'week',
				dayGridDay: 'day',
				dayGridMonth: 'month',
			};

			const viewName = map[view.type] || view.type;

			let title: string;

			const format = this.titleFormat[viewName];

			if (viewName === 'week') {
				const start = this.dateToMoment(view.currentStart).format(format);
				const end = this.dateToMoment(view.currentEnd).subtract(1, 'minute').format(format);

				title = start !== end ? start + this.rangeSeparator + end : start;
			} else {
				// This is the change from the original
				title = this.dateToMoment(view.currentStart).format(format);
			}

			if (this.options.userId && this.options.userName) {
				title += ' (' + this.options.userName + ')';
			}

			title = this.getHelper().escapeString(title);

			return title;
		}
	},
);
