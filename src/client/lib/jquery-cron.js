/*
 * jQuery gentleSelect plugin (version 0.1.4.1)
 * http://shawnchin.github.com/jquery-cron
 *
 * Changes by Apertia Tech s.r.o. (https://www.apertia.cz)
 * List of changes:
 * - added support for localization
 * - added Espo classes
 * - added Weekend and Weekday options
 * - changed error handling
 * - minimal es6 refactoring
 */
(function ($) {
	const defaults = {
		initial: '* * * * *',
		minuteOpts: {
			minWidth: 100, // only applies if columns and itemWidth not set
			itemWidth: 30,
			columns: 4,
			rows: undefined,
			title: 'Minutes Past the Hour',
		},
		timeHourOpts: {
			minWidth: 100, // only applies if columns and itemWidth not set
			itemWidth: 20,
			columns: 2,
			rows: undefined,
			title: 'Time: Hour',
		},
		domOpts: {
			minWidth: 100, // only applies if columns and itemWidth not set
			itemWidth: 30,
			columns: undefined,
			rows: 10,
			title: 'Day of Month',
		},
		monthOpts: {
			minWidth: 100, // only applies if columns and itemWidth not set
			itemWidth: 100,
			columns: 2,
			rows: undefined,
			title: undefined,
		},
		dowOpts: {
			minWidth: 100, // only applies if columns and itemWidth not set
			itemWidth: undefined,
			columns: undefined,
			rows: undefined,
			title: undefined,
		},
		timeMinuteOpts: {
			minWidth: 100, // only applies if columns and itemWidth not set
			itemWidth: 20,
			columns: 4,
			rows: undefined,
			title: 'Time: Minute',
		},
		effectOpts: {
			openSpeed: 400,
			closeSpeed: 400,
			openEffect: 'slide',
			closeEffect: 'slide',
			hideOnMouseOut: true,
		},
		url_set: undefined,
		customValues: undefined,
		onChange: undefined, // callback function each time value changes
		useGentleSelect: false,
		labels: {
			months: [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December',
			],
			days: [
				'Sunday',
				'Monday',
				'Tuesday',
				'Wednesday',
				'Thursday',
				'Friday',
				'Saturday',
			],
			periods: ['day', 'week', 'month', 'year'],
			unsupported:
				'Unsupported cron expression. Please continue editing the expression in Advanced mode.',
			Weekends: 'Weekends',
			Weekdays: 'Weekdays',
			Every: 'Every',
			'on the': 'on the',
			of: 'of',
			'minutes past the hour': 'minutes past the hour',
			at: 'at',
			st: 'st',
			nd: 'nd',
			rd: 'rd',
			th: 'th',
		},
	};

	// -------  build some static data -------

	// options for minutes in an hour - limited to 0, 15, 30, 45
	let str_opt_mih = '';
	const allowedMinutes = [0, 15, 30, 45];
	for (let i of allowedMinutes) {
		let j = i < 10 ? '0' : '';
		str_opt_mih += "<option value='" + i + "'>" + j + i + '</option>\n';
	}

	// options for hours in a day - limited to every 3 hours
	let str_opt_hid = '';
	const allowedHours = [0, 3, 6, 9, 12, 15, 18, 21];
	for (let i of allowedHours) {
		let j = i < 10 ? '0' : '';
		str_opt_hid += "<option value='" + i + "'>" + j + i + '</option>\n';
	}

	// display matrix
	let toDisplay = {
		minute: [],
		hour: ['mins'],
		day: ['time'],
		week: ['time', 'dow'],
		month: ['time', 'dom'],
		year: ['time', 'dom', 'month'],
	};

	let combinations = {
		minute: /^(\*\s){4}\*$/, // "* * * * *"
		hour: /^\d{1,2}\s(\*\s){3}\*$/, // "? * * * *"
		day: /^(\d{1,2}\s){2}(\*\s){2}\*$/, // "? ? * * *"
		week: /^(\d{1,2}\s){2}(\*\s){2}(\d|\*|(\d+([/-])\d)|(\d,)+\d)$/, // "? ? * * ?"
		month: /^(\d{1,2}\s){3}\*\s\*$/, // "? ? ? * *"
		year: /^(\d{1,2}\s){4}\*$/, // "? ? ? ? *"
	};

	// ------------------ internal functions ---------------
	function defined(obj) {
		return typeof obj != 'undefined';
	}

	function undefinedOrObject(obj) {
		return !defined(obj) || typeof obj === 'object';
	}

	function getCronType(cron_str, opts) {
		// if customValues defined, check for matches there first
		if (defined(opts.customValues)) {
			for (let key in opts.customValues) {
				if (cron_str === opts.customValues[key]) {
					return key;
				}
			}
		}

		// check format of initial cron value
		let valid_cron =
			/^((\d{1,2}|\*)\s){4}(\d|\*|(\d+([/-])\d)|(\d,)+\d)$/;
		if (typeof cron_str != 'string' || !valid_cron.test(cron_str)) {
			return undefined;
		}

		// check actual cron values
		let d = cron_str.split(' ');
		//            mm, hh, DD, MM, DOW
		let minval = [0, 0, 1, 1, 0];
		let maxval = [59, 23, 31, 12, 6];
		for (let i = 0; i < d.length; i++) {
			if (d[i] === '*') continue;
			let v = parseInt(d[i]);
			if (defined(v) && v <= maxval[i] && v >= minval[i]) continue;

			$.error(
				'cron: invalid value found (col ' +
					(i + 1) +
					') in ' +
					cron_str,
			);
			return undefined;
		}

		// determine combination
		for (let t in combinations) {
			if (combinations[t].test(cron_str)) {
				return t;
			}
		}

		// unknown combination
		return undefined;
	}

	function hasError(_c, o) {
		if (!defined(getCronType(o.initial, o))) {
			return true;
		}
		if (!undefinedOrObject(o.customValues)) {
			return true;
		}

		// ensure that customValues keys do not coincide with existing fields
		if (defined(o.customValues)) {
			for (let key in o.customValues) {
				if (Object.prototype.hasOwnProperty.call(combinations, key)) {
					$.error(
						"cron: reserved keyword '" +
							key +
							"' should not be used as customValues key.",
					);
					return true;
				}
			}
		}

		return false;
	}

	function getCurrentValue(c) {
		let b = c.data('block');
		let o = c.data('options'); // Get options from jQuery data
		let min, hour, day, month, dow;
		min = hour = day = month = dow = '*';
		let selectedPeriod = b['period'].find('select').val();
		switch (selectedPeriod) {
			case 'minute':
				break;

			case 'hour':
				min = b['mins'].find('select').val();
				break;

			case 'day':
				// Use dateStart time if provided, otherwise default to midnight
				min = o.dateStartMinutes || 0;
				hour = o.dateStartHours || 0;
				break;

			case 'week':
				// Use dateStart time if provided, otherwise default to midnight
				min = o.dateStartMinutes || 0;
				hour = o.dateStartHours || 0;
				dow = b['dow'].find('select').val();
				break;

			case 'month':
				// Use dateStart time if provided, otherwise default to midnight
				min = o.dateStartMinutes || 0;
				hour = o.dateStartHours || 0;
				day = b['dom'].find('select').val();
				break;

			case 'year':
				// Use dateStart time if provided, otherwise default to midnight
				min = o.dateStartMinutes || 0;
				hour = o.dateStartHours || 0;
				day = b['dom'].find('select').val();
				month = b['month'].find('select').val();
				break;

			default:
			// we assume this only happens when customValues is set
				return selectedPeriod;
		}
		return [min, hour, day, month, dow].join(' ');
	}

	// -------------------  PUBLIC METHODS -----------------

	let methods = {
		init: function (opts) {
			// init options
			let options = opts ? opts : {}; /* default to empty obj */
			let o = $.extend([], defaults, options);
			let eo = $.extend({}, defaults.effectOpts, options.effectOpts);

			$.extend(o, {
				minuteOpts: $.extend(
					{},
					defaults.minuteOpts,
					eo,
					options.minuteOpts,
				),
				domOpts: $.extend({}, defaults.domOpts, eo, options.domOpts),
				monthOpts: $.extend(
					{},
					defaults.monthOpts,
					eo,
					options.monthOpts,
				),
				dowOpts: $.extend({}, defaults.dowOpts, eo, options.dowOpts),
				timeHourOpts: $.extend(
					{},
					defaults.timeHourOpts,
					eo,
					options.timeHourOpts,
				),
				timeMinuteOpts: $.extend(
					{},
					defaults.timeMinuteOpts,
					eo,
					options.timeMinuteOpts,
				),
			});

			// error checking
			if (hasError(this, o)) {
				this.text(o.labels.unsupported);
				return this;
			}

			// options for months
			let str_opt_month = '';
			let label_months = o.labels.months;
			for (let i = 0; i < label_months.length; i++) {
				str_opt_month +=
					"<option value='" +
					(i + 1) +
					"'>" +
					label_months[i] +
					'</option>\n';
			}

			// options for day of week
			let str_opt_dow = '';
			let label_days = o.labels.days;
			for (let i = 0; i < label_days.length; i++) {
				str_opt_dow +=
					"<option value='" +
					i +
					"'>" +
					label_days[i] +
					'</option>\n';
			}

			str_opt_dow +=
				"<option value='1-5'>" + o.labels['Weekdays'] + '</option>\n';
			str_opt_dow +=
				"<option value='0,6'>" + o.labels['Weekends'] + '</option>\n';

			// options for period
			let str_opt_period = '';
			let label_periods = o.labels.periods;
			const periodValues = ['day', 'week', 'month', 'year']; // Fixed values for the reduced set
			// Skip first two labels (minute and hour) if they exist
			const startIndex = label_periods.length > 4 ? 2 : 0;
			for (let i = startIndex; i < label_periods.length; i++) {
				const valueIndex = i - startIndex;
				if (valueIndex < periodValues.length) {
					str_opt_period +=
						"<option value='" +
						periodValues[valueIndex] +
						"'>" +
						label_periods[i] +
						'</option>\n';
				}
			}

			// options for days of month
			let str_opt_dom = '',
				suffix;
			for (let i = 1; i < 32; i++) {
				if (i === 1 || i === 21 || i === 31) {
					suffix = o.labels['st'];
				} else if (i === 2 || i === 22) {
					suffix = o.labels['nd'];
				} else if (i === 3 || i === 23) {
					suffix = o.labels['rd'];
				} else {
					suffix = o.labels['th'];
				}
				str_opt_dom +=
					"<option value='" + i + "'>" + i + suffix + '</option>\n';
			}

			// ---- define select boxes in the right order -----

			let block = [],
				custom_periods = '',
				cv = o.customValues;
			if (defined(cv)) {
				// prepend custom values if specified
				for (let key in cv) {
					custom_periods +=
						"<option value='" +
						cv[key] +
						"'>" +
						key +
						'</option>\n';
				}
			}

			block['period'] = $(
				"<span class='cron-period'>" +
					o.labels['Every'] +
					" <select name='cron-period' class='form-control cron-expression-select'>" +
					custom_periods +
					str_opt_period +
					'</select> </span>',
			)
				.appendTo(this)
				.data('root', this);

			let select = block['period'].find('select');
			select
				.bind('change.cron', event_handlers.periodChanged)
				.data('root', this);
			if (o.useGentleSelect) select.gentleSelect(eo);

			block['dom'] = $(
				"<span class='cron-block cron-block-dom'>" +
					' ' +
					o.labels['on the'] +
					" <select name='cron-dom' class='form-control cron-expression-select'>" +
					str_opt_dom +
					'</select> </span>',
			)
				.appendTo(this)
				.data('root', this);

			select = block['dom'].find('select').data('root', this);
			if (o.useGentleSelect) select.gentleSelect(o.domOpts);

			block['month'] = $(
				"<span class='cron-block cron-block-month'>" +
					' ' +
					o.labels['of'] +
					" <select name='cron-month' class='form-control cron-expression-select'>" +
					str_opt_month +
					'</select> </span>',
			)
				.appendTo(this)
				.data('root', this);

			select = block['month'].find('select').data('root', this);
			if (o.useGentleSelect) select.gentleSelect(o.monthOpts);

			block['mins'] = $(
				"<span class='cron-block cron-block-mins'>" +
					' ' +
					o.labels['at'] +
					" <select name='cron-mins' class='form-control cron-expression-select'>" +
					str_opt_mih +
					'</select> ' +
					o.labels['minutes past the hour'] +
					' </span>',
			)
				.appendTo(this)
				.data('root', this);

			select = block['mins'].find('select').data('root', this);
			if (o.useGentleSelect) select.gentleSelect(o.minuteOpts);

			block['dow'] = $(
				"<span class='cron-block cron-block-dow'> " +
					o.labels['at'] +
					" <select name='cron-dow' class='form-control cron-expression-select'>" +
					str_opt_dow +
					'</select> </span>',
			)
				.appendTo(this)
				.data('root', this);

			select = block['dow'].find('select').data('root', this);
			if (o.useGentleSelect) select.gentleSelect(o.dowOpts);

			block['time'] = $(
				"<span class='cron-block cron-block-time'>" +
					' ' +
					o.labels['at'] +
					" <select name='cron-time-hour' class='cron-time-hour form-control cron-expression-select'>" +
					str_opt_hid +
					"</select><span class='cron-time-separator'>:</span><select name='cron-time-min' class='cron-time-min form-control cron-expression-select'>" +
					str_opt_mih +
					' </span>',
			)
				.appendTo(this)
				.data('root', this);

			select = block['time']
				.find('select.cron-time-hour')
				.data('root', this);
			if (o.useGentleSelect) select.gentleSelect(o.timeHourOpts);
			select = block['time']
				.find('select.cron-time-min')
				.data('root', this);
			if (o.useGentleSelect) select.gentleSelect(o.timeMinuteOpts);

			block['controls'] = $(
				"<span class='cron-controls'>&laquo; save " +
					"<span class='cron-button cron-button-save'></span>" +
					' </span>',
			)
				.appendTo(this)
				.data('root', this)
				.find('span.cron-button-save')
				.bind('click.cron', event_handlers.saveClicked)
				.data('root', this)
				.end();

			this.find('select').bind(
				'change.cron-callback',
				event_handlers.somethingChanged,
			);
			this.data('options', o).data('block', block); // store options and block pointer
			this.data('current_value', o.initial); // remember base value to detect changes

			return methods['value'].call(this, o.initial); // set initial value
		},

		value: function (cron_str) {
			// when no args, act as getter
			if (!cron_str) {
				return getCurrentValue(this);
			}

			let o = this.data('options');
			let block = this.data('block');
			let useGentleSelect = o.useGentleSelect;
			let t = getCronType(cron_str, o);

			if (!defined(t)) {
				return false;
			}

			if (defined(o.customValues) && Object.prototype.hasOwnProperty.call(o.customValues, t)) {
				t = o.customValues[t];
			} else {
				let d = cron_str.split(' ');
				let v = {
					mins: d[0],
					hour: d[1],
					dom: d[2],
					month: d[3],
					dow: d[4],
				};

				// update appropriate select boxes
				let targets = toDisplay[t];
				for (let i = 0; i < targets.length; i++) {
					let tgt = targets[i];
					if (tgt === 'time') {
						let btgt = block[tgt]
							.find('select.cron-time-hour')
							.val(v['hour']);
						if (useGentleSelect) btgt.gentleSelect('update');

						btgt = block[tgt]
							.find('select.cron-time-min')
							.val(v['mins']);
						if (useGentleSelect) btgt.gentleSelect('update');
					} else {
						let btgt = block[tgt].find('select').val(v[tgt]);
						if (useGentleSelect) btgt.gentleSelect('update');
					}
				}
			}

			// trigger change event
			let bp = block['period'].find('select').val(t);
			if (useGentleSelect) bp.gentleSelect('update');
			bp.trigger('change');

			// Update plain text display after values are set
			if (t === 'day' || t === 'week' || t === 'month' || t === 'year') {
				setTimeout(() => {
					const hourSelect = block['time'].find('select.cron-time-hour');
					const minSelect = block['time'].find('select.cron-time-min');
					const hour = hourSelect.val() || '00';
					const min = minSelect.val() || '00';

					// Update existing text if it exists
					const existingText = block['time'].find('.cron-time-text');
					if (existingText.length) {
						const timeText = String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
						existingText.text(timeText);
					}
				}, 0);
			}

			return this;
		},
	};

	let event_handlers = {
		periodChanged: function () {
			let root = $(this).data('root');
			root.data('options');
			let block = root.data('block');
			let period = $(this).val();

			root.find('span.cron-block').hide(); // first, hide all blocks
			if (Object.prototype.hasOwnProperty.call(toDisplay, period)) {
				// not custom value
				let b = toDisplay[$(this).val()];
				for (let i = 0; i < b.length; i++) {
					block[b[i]].show();
				}

				// For day/week/month/year periods, replace selectors with plain text
				if (period === 'day' || period === 'week' || period === 'month' || period === 'year') {
					// Get the current values
					const hourSelect = block['time'].find('select.cron-time-hour');
					const minSelect = block['time'].find('select.cron-time-min');
					const separator = block['time'].find('.cron-time-separator');
					const hour = hourSelect.val() || '00';
					const min = minSelect.val() || '00';

					// Hide the selects and separator
					hourSelect.hide();
					minSelect.hide();
					separator.hide();

					// Remove any existing time text and add plain text display
					block['time'].find('.cron-time-text').remove();
					const timeText = String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
					// Just plain text, no styling
					hourSelect.before('<span class="cron-time-text">' + timeText + '</span>');
				} else {
					// Show the selects and separator again
					block['time'].find('select.cron-time-hour').show().prop('disabled', false);
					block['time'].find('select.cron-time-min').show().prop('disabled', false);
					block['time'].find('.cron-time-separator').show();
					block['time'].find('.cron-time-text').remove();
				}
			}
		},

		somethingChanged: function () {
			let root = $(this).data('root');
			// if AJAX url defined, show "save"/"reset" button
			if (defined(root.data('options').url_set)) {
				if (methods.value.call(root) !== root.data('current_value')) {
					// if changed
					root.addClass('cron-changed');
					root.data('block')['controls'].fadeIn();
				} else {
					// values manually reverted
					root.removeClass('cron-changed');
					root.data('block')['controls'].fadeOut();
				}
			} else {
				root.data('block')['controls'].hide();
			}

			// chain in user defined event handler, if specified
			let oc = root.data('options').onChange;
			if (defined(oc) && $.isFunction(oc)) {
				oc.call(root);
			}
		},

		saveClicked: function () {
			let btn = $(this);
			let root = btn.data('root');
			let cron_str = methods.value.call(root);

			if (btn.hasClass('cron-loading')) {
				return;
			} // in progress
			btn.addClass('cron-loading');

			$.ajax({
				type: 'POST',
				url: root.data('options').url_set,
				data: { cron: cron_str },
				success: function () {
					root.data('current_value', cron_str);
					btn.removeClass('cron-loading');
					// data changed since "save" clicked?
					if (cron_str === methods.value.call(root)) {
						root.removeClass('cron-changed');
						root.data('block').controls.fadeOut();
					}
				},
				error: function () {
					alert(
						'An error occured when submitting your request. Try again?',
					);
					btn.removeClass('cron-loading');
				},
			});
		},
	};

	$.fn.cron = function (method) {
		if (methods[method]) {
			return methods[method].apply(
				this,
				Array.prototype.slice.call(arguments, 1),
			);
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.cron');
		}
	};

	window.cronLabelsLocalisation = defaults.labels;
})(jQuery);