define(['views/fields/base'], Dep => class extends Dep {
	listTemplate = 'autocrm:fields/time/list';
	listLinkTemplate = 'autocrm:fields/time/list-link';
	detailTemplate = 'autocrm:fields/time/detail';
	editTemplate = 'autocrm:fields/time/edit';
	searchTemplate = 'autocrm:fields/time/search';

	validations = ['required', 'time'];

	timeFormatMap = {
		'HH:mm': 'H:i',
		'hh:mm A': 'h:i A',
		'hh:mm a': 'h:i a',
		'hh:mmA': 'h:iA',
		'hh:mma': 'h:ia',
	};

	timeFormatMapWithSeconds = {
		'HH:mm:ss': 'H:i:s',
		'hh:mm:ss A': 'h:i:s A',
		'hh:mm:ss a': 'h:i:s a',
		'hh:mm:ssA': 'h:i:sA',
		'hh:mm:ssa': 'h:i:sa',
	};

	searchTypeList = ['after', 'before', 'between'];

	data() {
		const data = super.data();

		data.timeValue = this.getTimeStringValue();

		data.isNone = data.dateValue === null;

		if (this.isSearchMode()) {
			const value = this.getSearchParamsData().value || this.searchParams.timeValue;
			const valueTo = this.getSearchParamsData().valueTo || this.searchParams.timeValueTo;

			data.dateValue = value;
			data.dateValueTo = valueTo;

			if (['lastXDays', 'nextXDays', 'olderThanXDays', 'afterXDays'].includes(this.getSearchType())) {
				data.number = this.searchParams.value;
			}
		}

		return data;
	}

	setup() {
		super.setup();

		const fieldDefs = this.getMetadata().get(['entityDefs', this.model.name, 'fields', this.name]) || {};
		this.params.displaySeconds = fieldDefs.displaySeconds;

		this.on('remove', () => this.destroyTimepicker());
		this.on('mode-changed', () => this.destroyTimepicker());
	}

	afterRender() {
		super.afterRender();

		if (!this.isEditMode() && !this.isSearchMode()) {
			return;
		}

		this.$element = this.$el.find('[data-name="' + this.name + '"]');
			
		const displaySeconds = this.params.displaySeconds || false;
			
		let timeFormat;
		if (displaySeconds) {
			// Use format with seconds when displaySeconds is true
			timeFormat = this.timeFormatMapWithSeconds[this.getDateTime().timeFormat + ':ss'];
		} else {
			// Use original format when displaySeconds is false
			timeFormat = this.timeFormatMap[this.getDateTime().timeFormat];
		}

		const options = {
			step: this.params.minuteStep || 30,
			scrollDefaultNow: true,
			timeFormat: timeFormat,
			showSecond: displaySeconds,
		};

		this.$element.timepicker(options);

		this.$element.on('change.timepicker', () => {
			this.trigger('change');
		});

		this.$el.find('button.time-picker-btn').on('click', () => {
			this.$element.timepicker('showWidget');
		});

		if (this.isSearchMode()) {
			const $searchType = this.$el.find('select.search-type');

			this.handleSearchType($searchType.val()); 
		}
	}

	setupSearch() {
		this.addHandler('change', 'select.search-type', (_, /** HTMLSelectElement */ target) => {
			this.handleSearchType(target.value);
		});
	}

	handleSearchType(type) {
		this.$el.find('div.primary').addClass('hidden');
		this.$el.find('div.additional').addClass('hidden');
		this.$el.find('div.additional-number').addClass('hidden');

		if (['after', 'before'].includes(type)) {
			this.$el.find('div.primary').removeClass('hidden');
		} else if (type === 'between') {
			this.$el.find('div.primary').addClass('hidden');
			this.$el.find('div.additional').removeClass('hidden');
		}
	}

	validateRequired() {
		if (!this.isRequired()) {
			return;
		}

		if (this.model.get(this.name) === null) {
			const msg = this.translate('fieldIsRequired', 'messages').replace('{field}', this.getLabelText());

			this.showValidationMessage(msg);

			return true;
		}
	}

	validateTime() {
		const value = this.model.get(this.name);

		if (value === null) {
			return;
		}

		// Always accept both formats (with or without seconds)
		const regex = /^(?:[01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

		if (!regex.test(value)) {
			const msg = this.translate('fieldShouldBeTime', 'messages').replace('{field}', this.getLabelText());

			this.showValidationMessage(msg);

			return true;
		}
	}

	getTimeStringValue() {
		const value = this.model.get(this.name);

		if (value === null) {
			return '';
		}

		// If displaySeconds is false and the value contains seconds, strip them for display only
		const displaySeconds = this.params.displaySeconds || false;
			
		if (!displaySeconds && value && value.includes(':')) {
			const parts = value.split(':');
			if (parts.length === 3) {
				const result = parts[0] + ':' + parts[1];
				return result;
			}
		}

		return value;
	}

	destroyTimepicker() {
		if (this.$element && this.$element.data('timepicker')) {
			this.$element.timepicker('remove');
		}
	}

	/** @inheritDoc */
	fetch() {
		const data = {};

		const value = this.$element.val();

		data[this.name] = this.parse(value); 

		return data;
	}

	/**
		 * @param {string} string
		 * @return {string|null}
		 */
	parse(string) {
		if (!string) {
			return null;
		}

		// Optional: Add additional parsing or formatting if needed
		return string;
	}
});
