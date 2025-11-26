define(['crm:views/dashlets/calendar'], Dep => 

/**
     * Custom calendar dashlet that supports team filtering for the basicWeekDetailed mode.
     */
	class extends Dep {

		afterRender() {
			const mode = this.getOption('mode');

			// For custom mode, add team filtering support
			if (mode === 'basicWeekDetailed') {
				const teamIdList = this.getOption('teamsIds');

				const viewName = this.getMetadata().get(['clientDefs', 'Calendar', 'calendarView']) ||
                    'crm:views/calendar/calendar';

				this.createView('calendar', viewName, {
					mode: 'agendaWeek',
					selector: '> .calendar-container',
					header: false,
					enabledScopeList: this.getOption('enabledScopeList'),
					containerSelector: this.getSelector(),
					teamIdList: teamIdList,
					scrollToNowSlots: 3,
					suppressLoadingAlert: true,
				}, view => {
					view.render();

					this.on('resize', () => {
						setTimeout(() => view.adjustSize(), 50);
					});
				});

				return;
			}

			// For all vanilla modes, use parent implementation
			super.afterRender();
		}
	}
);
