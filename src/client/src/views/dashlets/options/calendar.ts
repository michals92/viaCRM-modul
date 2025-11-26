define(['crm:views/dashlets/options/calendar'], Dep => 

/**
     * Custom calendar dashlet options that shows teams field for basicWeekDetailed mode.
     */
	class extends Dep {

		manageFields(_model, _value, o) {
			if (this.model.get('mode') === 'timeline') {
				this.showField('users');
			} else {
				this.hideField('users');
			}

			if (
				this.getAcl().getPermissionLevel('userCalendar') !== 'no' &&
                ['basicWeek', 'month', 'basicDay', 'basicWeekDetailed'].includes(this.model.get('mode'))
			) {
				this.showField('teams');
			} else {
				if (o && o.ui) {
					this.model.set('teamsIds', []);
				}

				this.hideField('teams');
			}
		}
	}
);
