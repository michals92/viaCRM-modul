define(['action-handler', 'moment'], (Dep, moment) => class extends Dep {
	checkVisibility() {
		return !!this.view
			.getMetadata()
			.get(['scopes', this.view.model.name, 'calendar']);
	}

	actionScheduleRecurrence() {
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
				this.view
					.getMetadata()
					.get([
						'clientDefs',
						'RecordRecurrence',
						'modalViews',
						'edit',
					]) || 'views/modals/edit';

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

	getSchedulingExpression() {
		const dateStart = this.view.model.get('dateStart');
		let minutes = 0,
			hour = 0;

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
});