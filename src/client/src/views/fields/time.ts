import type BaseFieldView from 'espocrm/src/views/fields/base';
import type Model from 'espocrm/src/model';
import type { TimeFieldData } from 'viacrm/types';

interface TimepickerElement extends JQuery {
	timepicker(options: Record<string, unknown>): void;
	timepicker(action: 'showWidget' | 'remove'): void;
	data(key: string): unknown;
}

define(
	['views/fields/base'],
	(Dep: typeof BaseFieldView) => class extends Dep {
		override listTemplate = 'viacrm:fields/time/list';
		override listLinkTemplate = 'viacrm:fields/time/list-link';
		override detailTemplate = 'viacrm:fields/time/detail';
		override editTemplate = 'viacrm:fields/time/edit';
		override searchTemplate = 'viacrm:fields/time/search';

		override validations = ['required', 'time'];

		timeFormatMap: Record<string, string> = {
			'HH:mm': 'H:i',
			'hh:mm A': 'h:i A',
			'hh:mm a': 'h:i a',
			'hh:mmA': 'h:iA',
			'hh:mma': 'h:ia',
		};

		timeFormatMapWithSeconds: Record<string, string> = {
			'HH:mm:ss': 'H:i:s',
			'hh:mm:ss A': 'h:i:s A',
			'hh:mm:ss a': 'h:i:s a',
			'hh:mm:ssA': 'h:i:sA',
			'hh:mm:ssa': 'h:i:sa',
		};

		searchTypeList = ['after', 'before', 'between'];

		declare $element: TimepickerElement;
		declare model: Model;
		declare name: string;
		declare params: { displaySeconds?: boolean; minuteStep?: number };
		declare searchParams: { timeValue?: string; timeValueTo?: string; value?: string };

		override data(): TimeFieldData {
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

		override setup(): void {
			super.setup();

			const fieldDefs = (this.getMetadata().get(['entityDefs', this.model.name, 'fields', this.name]) as { displaySeconds?: boolean }) || {};
			this.params.displaySeconds = fieldDefs.displaySeconds;

			this.on('remove', () => this.destroyTimepicker());
			this.on('mode-changed', () => this.destroyTimepicker());
		}

		override afterRender(): void {
			super.afterRender();

			if (!this.isEditMode() && !this.isSearchMode()) {
				return;
			}

			this.$element = this.$el.find('[data-name="' + this.name + '"]') as TimepickerElement;

			const displaySeconds = this.params.displaySeconds || false;

			let timeFormat: string;
			if (displaySeconds) {
				timeFormat = this.timeFormatMapWithSeconds[this.getDateTime().timeFormat + ':ss'];
			} else {
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

				this.handleSearchType($searchType.val() as string);
			}
		}

		override setupSearch(): void {
			this.addHandler('change', 'select.search-type', (_: unknown, target: HTMLSelectElement) => {
				this.handleSearchType(target.value);
			});
		}

		handleSearchType(type: string): void {
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

		override validateRequired(): boolean | void {
			if (!this.isRequired()) {
				return;
			}

			if (this.model.get(this.name) === null) {
				const msg = (this.translate('fieldIsRequired', 'messages') as string).replace('{field}', this.getLabelText());

				this.showValidationMessage(msg);

				return true;
			}
		}

		validateTime(): boolean | void {
			const value = this.model.get(this.name) as string | null;

			if (value === null) {
				return;
			}

			const regex = /^(?:[01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

			if (!regex.test(value)) {
				const msg = (this.translate('fieldShouldBeTime', 'messages') as string).replace('{field}', this.getLabelText());

				this.showValidationMessage(msg);

				return true;
			}
		}

		getTimeStringValue(): string {
			const value = this.model.get(this.name) as string | null;

			if (value === null) {
				return '';
			}

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

		destroyTimepicker(): void {
			if (this.$element && this.$element.data('timepicker')) {
				this.$element.timepicker('remove');
			}
		}

		override fetch(): Record<string, string | null> {
			const data: Record<string, string | null> = {};

			const value = this.$element.val() as string;

			data[this.name] = this.parse(value);

			return data;
		}

		parse(string: string): string | null {
			if (!string) {
				return null;
			}

			return string;
		}
	},
);
