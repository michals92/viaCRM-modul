extend(['moment'], (Dep, moment) => class extends Dep {
	detailTemplate = 'autocrm:fields/date/detail';
	listTemplate = 'autocrm:fields/date/list';
	editTemplate = 'autocrm:fields/date/edit';

	init() {
		super.init();

		// Add yesterday before 'today' and tomorrow after 'today' if they don't already exist
		const todayIndex = this.searchTypeList.indexOf('today');
		if (todayIndex !== -1) {
			if (!this.searchTypeList.includes('yesterday')) {
				this.searchTypeList.splice(todayIndex, 0, 'yesterday');
			}
			// Recalculate todayIndex in case yesterday was inserted
			const newTodayIndex = this.searchTypeList.indexOf('today');
			if (!this.searchTypeList.includes('tomorrow')) {
				this.searchTypeList.splice(newTodayIndex + 1, 0, 'tomorrow');
			}
		}
	}

	setup() {
		super.setup();

		if (this.isDetailMode()) {
			if (this.params.copyToClipboard) {
				this.events['click [data-action="copyToClipboard"]'] = () => this.copyToClipboard();
			}
		}
	}

	data() {
		const data = super.data();

		data.copyToClipboard = this.params.copyToClipboard;

		const [style, iconClass] = this.getStatus();

		data.style = style;
		data.iconClass = iconClass;

		return data;
	}

	copyToClipboard() {
		const value = this.getDateStringValue();

		if (value) {
			navigator.clipboard
				.writeText(value)
				.then(() => {
					Espo.Ui.success(this.translate('Copied to clipboard'));
				})
				.catch(err => {
					Espo.Ui.error(this.translate('Failed to copy to clipboard'));
					console.error('Clipboard copy failed:', err);
				});
		}
	}

	/**
	 * Determine the status of the date (e.g., warning, danger) and corresponding icon class.
	 *
	 * @returns {[string|null, string|null]} An array containing the style and icon class.
	 */
	getStatus() {
		switch (this.params.advancedStyle) {
			case 'deadline':
				return this.getDeadlineStyle();
			default:
			// Backwards compatibility
				if (this.getFieldParamValue('dateWarning')) {
					return this.getDeadlineStyle();
				} else {
					return [null, null];
				}
		}
	}

	getDeadlineStyle() {
		const dateValue = this.model.get(this.name);

		if (!dateValue) {
			return [null, null];
		}

		const dateTime = this.getDateTime();
		const today = dateTime.getToday(); // Format: 'YYYY-MM-DD'

		const dateMoment = dateTime.toMomentDate(dateValue); // Moment instance in system timezone

		// Clone the moment instance to avoid mutating the original
		const date = dateMoment.clone().format(dateTime.internalDateFormat); // 'YYYY-MM-DD'

		if (today === date) {
			return ['warning', 'fa-exclamation-triangle'];
		}

		if (today > date) {
			return ['danger', 'fa-skull'];
		}

		return [null, null];
	}

	getFieldParamValue(fieldParam) {
		return this.getMetadata().get(['entityDefs', this.model.entityType, 'fields', this.name, fieldParam], null);
	}

	validateAfter() {
		const field = this.params.after;

		if (field === 'today') {
			const dateTime = this.getDateTime();
			const value = this.model.get(this.name);
			const otherValue = dateTime.getToday();

			if (!(value && otherValue)) {
				return false;
			}

			const unix = moment(value).unix();
			const otherUnix = moment(otherValue).unix();

			if (this.params.afterOrEqual && unix === otherUnix) {
				return false;
			}

			if (unix <= otherUnix) {
				const msg = this.translate('fieldShouldAfterToday', 'messages')
					.replace('{field}', this.getLabelText())
					.replace('{otherField}', this.translate(field, 'fields', this.entityType));

				this.showValidationMessage(msg);

				return true;
			}

			return false;
		}

		return super.validateAfter();
	}

	/**
	 * Setup datepicker options - can be overridden by child classes
	 */
	setupDatepickerOptions() {
		const options = {
			format: this.getDateTime().dateFormat,
			weekStart: this.getDateTime().weekStart,
			startDate: this.getStartDateForDatePicker(),
			todayButton: this.getConfig().get('datepickerTodayButton') || false,
		};

		if (this.params.datepickerOptions) {
			Object.assign(options, this.params.datepickerOptions);
		}

		return options;
	}

});
