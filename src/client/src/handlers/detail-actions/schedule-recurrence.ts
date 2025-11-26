import type ActionHandler from 'espocrm/src/action-handler';
import type MomentType from 'moment';
import type Metadata from 'espocrm/src/metadata';
import type Model from 'espocrm/src/model';
import type View from 'espocrm/src/bull/view';
import type { ScheduleRecurrenceViewOptions } from 'viacrm/types';

interface DateTimeHelper {
	toMoment(dateString: string): MomentType.Moment;
}

interface RecurrenceView extends View {
	model: Model & { name: string; id: string };
	getMetadata(): Metadata;
	translate(label: string, category: string, scope: string): string;
	createView(
		name: string,
		viewName: string,
		options: ScheduleRecurrenceViewOptions,
		callback: (view: View & { render(): void; notify(value: boolean): void }) => void
	): void;
	getDateTime?(): DateTimeHelper;
	getHelper?(): { dateTime: DateTimeHelper };
}

define(
	['action-handler', 'moment'],
	(Dep: typeof ActionHandler, moment: typeof MomentType) => class extends Dep {
		declare view: RecurrenceView;

		checkVisibility(): boolean {
			return !!this.view
				.getMetadata()
				.get(['scopes', this.view.model.name, 'calendar']);
		}

		actionScheduleRecurrence(): void {
			if (!this.view.model.get('dateStart')) {
				Espo.Ui.notify(
					this.view.translate(
						'missingDateStart',
						'messages',
						'RecordRecurrence',
					),
					'warning',
				);
				return;
			}

			const viewName =
				(this.view
					.getMetadata()
					.get([
						'clientDefs',
						'RecordRecurrence',
						'modalViews',
						'edit',
					]) as string) || 'views/modals/edit';

			const attributes = {
				name: this.view.model.get('name'),
				data: {
					id: this.view.model.id,
					dateStart: this.view.model.get('dateStart'),
				},
				entityType: this.view.model.name,
				scheduling: this.getSchedulingExpression(),
			};

			Espo.Ui.notifyWait();

			this.view.createView(
				'quickCreate',
				viewName,
				{
					scope: 'RecordRecurrence',
					fullFormDisabled: true,
					attributes,
				},
				view => {
					view.render();
					view.notify(false);
				},
			);
		}

		getSchedulingExpression(): string {
			const dateStart = this.view.model.get('dateStart') as string | null;
			let minutes = 0;
			let hour = 0;

			if (dateStart) {
				// Convert UTC dateStart to display time (user's timezone)
				// EspoCRM stores datetime in UTC, but we need local time for the cron expression

				// Try to get the dateTime helper from the view
				const dateTime = this.view.getDateTime ? this.view.getDateTime() :
					this.view.getHelper ? this.view.getHelper().dateTime : null;

				if (dateTime && dateTime.toMoment) {
					// Use EspoCRM's datetime helper
					const m = dateTime.toMoment(dateStart);
					if (m && m.isValid()) {
						hour = m.hours();
						minutes = m.minutes();
					}
				} else if (moment) {
					// Use moment directly with UTC conversion
					const m = moment.utc(dateStart).local();
					if (m.isValid()) {
						hour = m.hours();
						minutes = m.minutes();
					}
				} else {
					// Fallback: create Date object and add 'Z' to treat as UTC
					const date = new Date(dateStart + 'Z');
					if (!isNaN(date.getTime())) {
						hour = date.getHours();
						minutes = date.getMinutes();
					}
				}
			}

			const expression = `${minutes} ${hour} * * *`;
			return expression;
		}
	},
);
