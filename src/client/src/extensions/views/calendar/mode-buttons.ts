import type CalendarModeButtons from 'espocrm/src/crm/views/calendar/mode-buttons';

type ModeButtonsOptions = {
	allDayDisabled?: boolean;
	[key: string]: unknown;
};

type ModeButtonsData = {
	allDayDisabled: boolean;
	[key: string]: unknown;
};

type CalendarView = {
	allDayDisabled?: boolean;
	calendar?: {
		refetchEvents(): void;
	};
};

extend<CalendarModeButtons>(Dep => class extends Dep {
	// Use the extended template
	override template = 'viacrm:calendar/mode-buttons';

	allDayDisabled: boolean = false;

	initialize(options: ModeButtonsOptions): void {
		super.initialize(options);

		// Initialize allDayDisabled from options or localStorage, default to false
		this.allDayDisabled = false;

		// If options has allDayDisabled, use that value
		if (options && 'allDayDisabled' in options) {
			this.allDayDisabled = options.allDayDisabled as boolean;
		}
		// Otherwise try to get from localStorage
		else {
			const stored = this.getStorage().get('state', 'calendarAllDayDisabled') as boolean | null;
			if (stored !== null) {
				this.allDayDisabled = stored;
			}
		}

		// Ensure the value is stored in localStorage
		this.getStorage().set('state', 'calendarAllDayDisabled', this.allDayDisabled);
	}

	override setup(): void {
		super.setup();

		// Add action handler for toggleAllDay button
		this.addActionHandler('toggleAllDay', () => {
			this.toggleAllDay();
		});
	}

	override data(): ModeButtonsData {
		const data = super.data() as ModeButtonsData;

		// Add allDayDisabled to the template data
		data.allDayDisabled = this.allDayDisabled;

		return data;
	}

	toggleAllDay(): void {
		// Toggle the state
		this.allDayDisabled = !this.allDayDisabled;

		// Store the state in localStorage
		this.getStorage().set('state', 'calendarAllDayDisabled', this.allDayDisabled);

		// Trigger an event to notify the calendar view
		this.trigger('toggle-all-day', this.allDayDisabled);

		// Re-render the view to update the button state
		this.reRender();

		// Refresh the calendar to apply the filter
		const calendarView = this.getParentView() as CalendarView | null;
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
