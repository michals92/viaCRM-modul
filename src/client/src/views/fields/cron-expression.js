define([
	'views/fields/varchar',
	'views/scheduled-job/fields/scheduling',
	/* only for loading*/ 'lib!JQueryCron',
	'lib!cronstrue',
	'moment',
], (Dep, SchedulingField, __, cronstrue, moment) => class extends Dep {
	forceTrim = true;
	viewMode = 'user-friendly';
	editTemplate = 'autocrm:fields/cron-expression/edit';
	validations = ['required', 'cron'];

	setup() {
		SchedulingField.prototype.setup.call(this);

		this.setupEvents();
	}

	setupEvents() {
		this.events['click .action[data-action="setViewMode"]'] = e => {
			e.preventDefault();

			this.actionSetViewMode();
		};
	}

	data() {
		const data = super.data();

		data.viewMode = this.viewMode;
		data.isAdvanced = this.viewMode === 'advanced';

		return data;
	}

	afterRender() {
		if (this.mode === 'edit') {
			if (this.viewMode === 'user-friendly') {
				this.$userFriendly = this.$el.find(
					'.cron-expr__user-friendly',
				);
				const data = this.model.get('data');
				let dateStartMinutes = 0;
				let dateStartHours = 0;

				if (data && data.dateStart) {
					// dateStart is in UTC, need to convert to local time

					// Try to get the dateTime helper from the view
					const dateTime = this.getDateTime ? this.getDateTime() :
						this.getHelper ? this.getHelper().dateTime : null;

					if (dateTime && dateTime.toMoment) {
						// Use EspoCRM's datetime helper
						const m = dateTime.toMoment(data.dateStart);
						if (m && m.isValid()) {
							dateStartHours = m.hours();
							dateStartMinutes = m.minutes();
						}
					} else if (moment) {
						// Use moment directly with UTC conversion
						const m = moment.utc(data.dateStart).local();
						if (m.isValid()) {
							dateStartHours = m.hours();
							dateStartMinutes = m.minutes();
						}
					} else {
						// Fallback: parse the UTC time manually
						const match = data.dateStart.match(/(\d{2}):(\d{2}):\d{2}$/);
						if (match) {
							// These are UTC hours, add timezone offset
							const utcDate = new Date(data.dateStart + 'Z');
							if (!isNaN(utcDate.getTime())) {
								dateStartHours = utcDate.getHours();
								dateStartMinutes = utcDate.getMinutes();
							}
						}
					}
				}

				this.$userFriendly.cron({
					initial: this.model.get(this.name),
					onChange: () => {
						this.cronExpressionChange();
					},
					labels: this.getTranslatedCronLabels(),
					dateStartMinutes: dateStartMinutes,
					dateStartHours: dateStartHours,
				});
				this.cronExpressionChange();
			} else {
				SchedulingField.prototype.afterRender.call(this);
			}
		}
	}

	getTranslatedCronLabels() {
		const labels = Object.keys(window.cronLabelsLocalisation);
		const translatedLabels = {};

		labels.forEach(label => {
			translatedLabels[label] = this.translate(
				label,
				'cronLabels',
				'RecordRecurrence',
			);
		});

		return translatedLabels;
	}

	cronExpressionChange() {
		try {
			const value = this.$userFriendly.cron('value');

			this.model.set(this.name, value);
		} catch (e) {
			// do nothing
		}
	}

	getValueForDisplay() {
		if (this.isListMode() || this.isDetailMode()) {
			const exp = this.model.get(this.name);
			return this.getReadableForm(exp);
		} else {
			return super.getValueForDisplay();
		}
	}

	setViewMode(mode) {
		this.viewMode = mode;
	}

	actionSetViewMode() {
		this.setViewMode(
			this.viewMode === 'advanced' ? 'user-friendly' : 'advanced',
		);
		this.reRender();
	}

	showText() {
		const exp = this.model.get(this.name);

		if (exp === '* * * * *') {
			this.$text.text(this.getReadableForm(exp));
			return;
		}

		SchedulingField.prototype.showText.call(this);
	}

	getReadableForm(exp) {
		let locale = 'en';

		const localeList = Object.keys(cronstrue.default.locales);
		const language = this.getLanguage().name;

		if (~localeList.indexOf(language)) {
			locale = language;
		} else if (~localeList.indexOf(language.split('_')[0])) {
			locale = language.split('_')[0];
		}

		try {
			return cronstrue.toString(exp, {
				use24HourTimeFormat: !this.getDateTime().hasMeridian(),
				locale,
			});
		} catch (e) {
			return this.translate('Not valid');
		}
	}

	validateCron() {
		const exp = this.model.get(this.name);

		try {
			cronstrue.toString(exp);
		} catch (e) {
			this.showValidationMessage(
				this.translate(
					'cronExprInvalid',
					'messages',
					'RecordRecurrence',
				),
			);
			return true;
		}

		return false;
	}

	fetch() {
		if (this.viewMode === 'advanced') {
			return super.fetch();
		}

		const data = {};

		data[this.name] = this.$userFriendly.cron('value');

		return data;
	}
});