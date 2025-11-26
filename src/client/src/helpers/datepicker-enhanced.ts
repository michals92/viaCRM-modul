interface DatepickerOptions {
	format?: string;
	weekStart?: number;
	startDate?: string;
	todayButton?: boolean;
	beforeShowDay?: (date: Date) => { enabled?: boolean; classes?: string; tooltip?: string } | undefined;
}

interface ViewWithDatepicker {
	$el: JQuery;
	name: string;
	mode: string;
	MODE_EDIT: string;
	MODE_SEARCH: string;
	getConfig(): { get(key: string): unknown };
	setupDatepickerOptions?: () => DatepickerOptions;
	trigger(event: string): void;
}

define(
	['moment'],
	() => class DatepickerEnhanced {
		view: ViewWithDatepicker;

		constructor(view: ViewWithDatepicker) {
			this.view = view;
		}

		setup(): void {
			if (typeof this.view.setupDatepickerOptions !== 'function') {
				console.warn('[DatepickerEnhanced] Field does not have setupDatepickerOptions method');
				return;
			}

			if (this.view.mode !== this.view.MODE_EDIT && this.view.mode !== this.view.MODE_SEARCH) {
				return;
			}

			const options = this.view.setupDatepickerOptions();

			this.setupDirectDatepicker(options);
		}

		setupDirectDatepicker(options: DatepickerOptions): void {
			const $element = this.view.$el.find(`[data-name="${this.view.name}"]`) as JQuery & { datepicker(method: string): void; datepicker(options: Record<string, unknown>): JQuery };

			if (!$element || !$element.length) {
				console.warn('[DatepickerEnhanced] No datepicker element found');
				return;
			}

			setTimeout(() => {
				$element.datepicker('destroy');

				$element.datepicker({
					autoclose: true,
					todayHighlight: true,
					format: options.format ? options.format.toLowerCase() : 'yyyy-mm-dd',
					weekStart: options.weekStart || 0,
					startDate: options.startDate,
					todayBtn: options.todayButton || false,
					orientation: 'bottom auto',
					language: this.view.getConfig().get('language') || 'en',
					beforeShowDay: options.beforeShowDay,
				}).on('changeDate', () => {
					this.view.trigger('change');
				});
			}, 50);
		}

		updateDatepicker(): void {
			if (typeof this.view.setupDatepickerOptions !== 'function') {
				return;
			}

			const options = this.view.setupDatepickerOptions();

			this.setupDirectDatepicker(options);
		}

		destroy(): void {
			const $element = this.view.$el.find(`[data-name="${this.view.name}"]`) as JQuery & { datepicker(method: string): void };
			if ($element && $element.length) {
				$element.datepicker('destroy');
			}
		}
	},
);
