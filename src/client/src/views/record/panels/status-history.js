define(['views/record/panels/bottom', 'vis-data', 'vis-timeline', 'moment'], (Dep, {DataSet}, {Timeline}, moment) => class extends Dep {

	// language=Handlebars
	templateContent = `
			<div class="timeline"></div>
			<link href="{{basePath}}client/modules/crm/css/vis.css" rel="stylesheet">
		`;

	data() {
		return {
			...super.data(),
		};
	}

	setup() {
		super.setup();

		this.once('remove', () => {
			this.destroyTimeline();
		});
	}

	destroyTimeline() {
		if (this.timeline) {
			this.timeline.destroy();
			this.timeline = null;
		}
	}

	showNoData() {
		this.noDataShown = true;
		this.destroyTimeline();

		this.$timeline.empty();
		this.$timeline.append(
			$('<div>')
				.addClass('revert-margin')
				.text(this.translate('No Data'))
		);
	}

	afterRender() {
		const $timeline = this.$timeline = this.$el.find('.timeline');

		this.noDataShown = false;
		this.$timeline.empty();

		if (!$timeline.get(0)) {
			return;
		}

		$timeline.get(0).innerHTML = '';

		this.fetchStatusHistory((statusHistory) => {
			if (!statusHistory || statusHistory.length === 0) {
				this.showNoData();
				return;
			}

			// Create groups from unique users
			const groupsData = this.createGroupsFromHistory(statusHistory);
			const groupsDataSet = new DataSet(groupsData);

			// Convert status history to timeline items
			const itemsData = this.convertToTimelineItems(statusHistory);
			const itemsDataSet = new DataSet(itemsData);

			// Calculate time range
			const timeRange = this.calculateTimeRange(statusHistory);

			// Initialize timeline
			this.destroyTimeline();

			this.timeline = new Timeline($timeline.get(0), itemsDataSet, groupsDataSet, {
				dataAttributes: 'all',
				start: timeRange.start,
				end: timeRange.end,
				moment: (date) => {
					const m = moment(date);
					return m.tz(this.getDateTime().getTimeZone());
				},
				xss: {
					filterOptions: {
						onTag: (_tag, html) => html,
					},
				},
				format: this.getFormatObject(),
				zoomable: true,
				moveable: true,
				orientation: 'top',
				editable: {
					add: false,
					updateTime: false,
					updateGroup: false,
					remove: false,
				},
				showCurrentTime: true,
				locales: {
					myLocale: {
						current: this.translate('current', 'labels', 'Calendar'),
						time: this.translate('time', 'labels', 'Calendar'),
					}
				},
				locale: 'myLocale',
				margin: {
					item: {
						vertical: 12,
					},
					axis: 6,
				},
			});
		});
	}

	fetchStatusHistory(callback) {
		const entityType = this.model.entityType;
		const entityId = this.model.id;

		if (!entityId) {
			callback([]);
			return;
		}

		const url = `StatusHistory?entityType=${entityType}&entityId=${entityId}`;

		Espo.Ajax.getRequest(url).then((data) => {
			callback(data.list || []);
		}).catch(() => {
			callback([]);
		});
	}

	convertToTimelineItems(statusHistory) {
		const items = [];

		statusHistory.forEach((item, index) => {
			const start = moment.utc(item.updatedAt).tz(this.getDateTime().getTimeZone());

			// Calculate end time (use next change or current time for last item)
			let end;
			if (index < statusHistory.length - 1) {
				end = moment.utc(statusHistory[index + 1].updatedAt).tz(this.getDateTime().getTimeZone());
			} else {
				end = moment().tz(this.getDateTime().getTimeZone());
			}

			const style = this.getStatusStyle(item.status);

			items.push({
				id: item.id,
				content: this.getItemContent(item),
				start: start.toDate(),
				end: end.toDate(),
				group: item.updatedById,
				className: 'status-history-item',
				style: style,
				title: this.getItemTooltip(item),
				type: 'range',
			});
		});

		return items;
	}

	getItemContent(item) {
		const entityType = this.model.entityType;
		const statusField = this.getMetadata().get(['scopes', entityType, 'statusField']) || 'status';
		const translatedStatus = this.getLanguage().translateOption(item.status, statusField, entityType);

		// Get the style class to determine text color
		const styles = this.getMetadata().get(['entityDefs', entityType, 'fields', statusField, 'style']) || {};
		const styleClass = styles[item.status] || 'default';
		const textColor = `var(--state-${styleClass}-text)`;

		return $('<div>')
			.addClass('status-history-content')
			.append(
				$('<span>')
					.addClass('status-label')
					.css('color', textColor)
					.text(translatedStatus || '')
			)
			.get(0).innerHTML;
	}

	getItemTooltip(item) {
		const entityType = this.model.entityType;
		const statusField = this.getMetadata().get(['scopes', entityType, 'statusField']) || 'status';
		const translatedStatus = this.getLanguage().translateOption(item.status, statusField, entityType);

		const parts = [];

		parts.push(`Status: ${translatedStatus}`);
		parts.push(`Updated by: ${item.updatedByName}`);
		parts.push(`At: ${this.getDateTime().toDisplay(item.updatedAt)}`);

		return parts.join('\n');
	}

	getStatusStyle(status) {
		// Try to get style from entityDefs field options
		const entityType = this.model.entityType;
		const statusField = this.getMetadata().get(['scopes', entityType, 'statusField']) || 'status';
		const styles = this.getMetadata().get(['entityDefs', entityType, 'fields', statusField, 'style']) || {};

		const styleClass = styles[status] || 'default';

		// Use CSS variables for background, border, and text colors
		const bgColor = `var(--state-${styleClass}-bg)`;
		const textColor = `var(--state-${styleClass}-text)`;

		return `background-color: ${bgColor}; border-color: ${bgColor}; color: ${textColor};`;
	}

	calculateTimeRange(statusHistory) {
		if (!statusHistory || statusHistory.length === 0) {
			return {
				start: moment().subtract(1, 'day').toDate(),
				end: moment().add(1, 'day').toDate(),
			};
		}

		const firstChange = moment.utc(statusHistory[0].updatedAt).tz(this.getDateTime().getTimeZone());
		const lastChange = moment.utc(statusHistory[statusHistory.length - 1].updatedAt).tz(this.getDateTime().getTimeZone());

		const diff = lastChange.diff(firstChange, 'hours');
		const padding = Math.max(diff * 0.1, 2); // 10% padding or 2 hours minimum

		return {
			start: firstChange.clone().subtract(padding, 'hours').toDate(),
			end: lastChange.clone().add(padding, 'hours').toDate(),
		};
	}

	getFormatObject() {
		return {
			minorLabels: {
				millisecond: 'SSS',
				second: 's',
				minute: this.getDateTime().getTimeFormat(),
				hour: this.getDateTime().getTimeFormat(),
				weekday: 'ddd D',
				day: 'D',
				month: 'MMM',
				year: 'YYYY'
			},
			majorLabels: {
				millisecond: this.getDateTime().getTimeFormat() + ' ss',
				second: this.getDateTime().getReadableDateFormat() + ' HH:mm',
				minute: 'ddd D MMMM',
				hour: 'ddd D MMMM',
				weekday: 'MMMM YYYY',
				day: 'MMMM YYYY',
				month: 'YYYY',
				year: ''
			}
		};
	}

	createGroupsFromHistory(statusHistory) {
		const userMap = new Map();

		statusHistory.forEach((item) => {
			if (item.updatedById && !userMap.has(item.updatedById)) {
				userMap.set(item.updatedById, item.updatedByName);
			}
		});

		const groups = [];
		let order = 0;

		userMap.forEach((name, id) => {
			groups.push({
				id: id,
				content: this.getGroupContent(id, name),
				order: order++,
			});
		});

		return groups;
	}

	getGroupContent(id, name) {
		const avatarHtml = this.getAvatarHtml(id);
		const $container = $('<span>');

		if (avatarHtml) {
			$container.append($(avatarHtml), ' ');
		}

		$container.append(
			$('<span>')
				.attr('data-id', id)
				.addClass('group-title')
				.text(name)
		);

		return $container.get(0).innerHTML;
	}

	getAvatarHtml(id) {
		if (this.getConfig().get('avatarsDisabled')) {
			return '';
		}

		let t;
		const cache = this.getCache();

		if (cache) {
			t = cache.get('app', 'timestamp');
		} else {
			t = Date.now();
		}

		return $('<img>')
			.addClass('avatar avatar-link')
			.attr('width', '16')
			.attr('src', this.getBasePath() + '?entryPoint=avatar&size=small&id=' + id + '&t=' + t)
			.get(0).outerHTML;
	}
});
