import type VarcharFieldView from 'espocrm/src/views/fields/varchar';
import type SchedulingFieldView from 'espocrm/src/views/scheduled-job/fields/scheduling';
import type Model from 'espocrm/src/model';
import type * as momentType from 'moment';
import type { CronExpressionFieldData } from 'viacrm/types';

interface CronstrueModule {
	toString(expression: string, options?: { use24HourTimeFormat?: boolean; locale?: string }): string;
	default: {
		locales: Record<string, unknown>;
	};
}

interface JQueryCronElement extends JQuery {
	cron(options: {
		initial?: string;
		onChange?: () => void;
		labels?: Record<string, string>;
		dateStartMinutes?: number;
		dateStartHours?: number;
	}): void;
	cron(action: 'value'): string;
}

declare global {
	interface Window {
		cronLabelsLocalisation: Record<string, string>;
	}
}

define(
	[
		'views/fields/varchar',
		'views/scheduled-job/fields/scheduling',
		'lib!JQueryCron',
		'lib!cronstrue',
		'moment',
	],
	(
		Dep: typeof VarcharFieldView,
		SchedulingField: typeof SchedulingFieldView,
		__: unknown,
		cronstrue: CronstrueModule,
		moment: typeof momentType,
	) => class extends Dep {
		forceTrim = true;
		viewMode: 'user-friendly' | 'advanced' = 'user-friendly';
		override editTemplate = 'viacrm:fields/cron-expression/edit';
		override validations = ['required', 'cron'];

		$userFriendly!: JQueryCronElement;
		$text!: JQuery;
		declare model: Model;
		declare name: string;
		declare mode: string;
		declare events: Record<string, (e: JQuery.ClickEvent) => void>;

		override setup(): void {
			SchedulingField.prototype.setup.call(this);

			this.setupEvents();
		}

		setupEvents(): void {
			this.events['click .action[data-action="setViewMode"]'] = (e: JQuery.ClickEvent) => {
				e.preventDefault();

				this.actionSetViewMode();
			};
		}

		override data(): CronExpressionFieldData {
			const data = super.data();

			data.viewMode = this.viewMode;
			data.isAdvanced = this.viewMode === 'advanced';

			return data;
		}

		override afterRender(): void {
			if (this.mode === 'edit') {
				if (this.viewMode === 'user-friendly') {
					this.$userFriendly = this.$el.find(
						'.cron-expr__user-friendly',
					) as JQueryCronElement;
					const data = this.model.get('data') as { dateStart?: string } | undefined;
					let dateStartMinutes = 0;
					let dateStartHours = 0;

					if (data && data.dateStart) {
						const dateTime = this.getDateTime ? this.getDateTime() :
							this.getHelper ? this.getHelper().dateTime : null;

						if (dateTime && dateTime.toMoment) {
							const m = dateTime.toMoment(data.dateStart);
							if (m && m.isValid()) {
								dateStartHours = m.hours();
								dateStartMinutes = m.minutes();
							}
						} else if (moment) {
							const m = moment.utc(data.dateStart).local();
							if (m.isValid()) {
								dateStartHours = m.hours();
								dateStartMinutes = m.minutes();
							}
						} else {
							const match = data.dateStart.match(/(\d{2}):(\d{2}):\d{2}$/);
							if (match) {
								const utcDate = new Date(data.dateStart + 'Z');
								if (!isNaN(utcDate.getTime())) {
									dateStartHours = utcDate.getHours();
									dateStartMinutes = utcDate.getMinutes();
								}
							}
						}
					}

					this.$userFriendly.cron({
						initial: this.model.get(this.name) as string,
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

		getTranslatedCronLabels(): Record<string, string> {
			const labels = Object.keys(window.cronLabelsLocalisation);
			const translatedLabels: Record<string, string> = {};

			labels.forEach(label => {
				translatedLabels[label] = this.translate(
					label,
					'cronLabels',
					'RecordRecurrence',
				) as string;
			});

			return translatedLabels;
		}

		cronExpressionChange(): void {
			try {
				const value = this.$userFriendly.cron('value');

				this.model.set(this.name, value);
			} catch (_e) {
				// do nothing
			}
		}

		override getValueForDisplay(): string {
			if (this.isListMode() || this.isDetailMode()) {
				const exp = this.model.get(this.name) as string;
				return this.getReadableForm(exp);
			} else {
				return super.getValueForDisplay();
			}
		}

		setViewMode(mode: 'user-friendly' | 'advanced'): void {
			this.viewMode = mode;
		}

		actionSetViewMode(): void {
			this.setViewMode(
				this.viewMode === 'advanced' ? 'user-friendly' : 'advanced',
			);
			this.reRender();
		}

		showText(): void {
			const exp = this.model.get(this.name) as string;

			if (exp === '* * * * *') {
				this.$text.text(this.getReadableForm(exp));
				return;
			}

			SchedulingField.prototype.showText.call(this);
		}

		getReadableForm(exp: string): string {
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
			} catch (_e) {
				return this.translate('Not valid') as string;
			}
		}

		validateCron(): boolean {
			const exp = this.model.get(this.name) as string;

			try {
				cronstrue.toString(exp);
			} catch (_e) {
				this.showValidationMessage(
					this.translate(
						'cronExprInvalid',
						'messages',
						'RecordRecurrence',
					) as string,
				);
				return true;
			}

			return false;
		}

		override fetch(): Record<string, string> {
			if (this.viewMode === 'advanced') {
				return super.fetch();
			}

			const data: Record<string, string> = {};

			data[this.name] = this.$userFriendly.cron('value');

			return data;
		}
	},
);
