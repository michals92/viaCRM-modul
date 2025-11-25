extend(Dep => class extends Dep {
	// Use the extended template
	template = 'viacrm:calendar/mode-buttons';

	initialize(options) {
		super.initialize(options);

		// Initialize allDayDisabled from options or localStorage, default to false
		this.allDayDisabled = false;

		// If options has allDayDisabled, use that value
		if (options && 'allDayDisabled' in options) {
			this.allDayDisabled = options.allDayDisabled;
		}
		// Otherwise try to get from localStorage
		else {
			const stored = this.getStorage().get('state', 'calendarAllDayDisabled');
			if (stored !== null) {
				this.allDayDisabled = stored;
			}
		}

		// Ensure the value is stored in localStorage
		this.getStorage().set('state', 'calendarAllDayDisabled', this.allDayDisabled);
	}

	setup() {
		super.setup();

		// Add action handler for toggleAllDay button
		this.addActionHandler('toggleAllDay', () => {
			this.toggleAllDay();
		});
	}

	data() {
		const data = super.data();

		// Add allDayDisabled to the template data
		data.allDayDisabled = this.allDayDisabled;

		return data;
	}

	toggleAllDay() {
		// Toggle the state
		this.allDayDisabled = !this.allDayDisabled;

		// Store the state in localStorage
		this.getStorage().set('state', 'calendarAllDayDisabled', this.allDayDisabled);

		// Trigger an event to notify the calendar view
		this.trigger('toggle-all-day', this.allDayDisabled);

		// Re-render the view to update the button state
		this.reRender();

		// Refresh the calendar to apply the filter
		const calendarView = this.getParentView();
		if (calendarView) {
			// Update the calendar view's allDayDisabled property
			calendarView.allDayDisabled = this.allDayDisabled;

			// Refresh the calendar if it exists
			if (calendarView.calendar) {
				calendarView.calendar.refetchEvents();
			}
		}
	}
});
