import type View from 'espocrm/src/view';

define(['autocrm:views/site/navbar/user-only'], (Dep: typeof View) => class extends Dep {
	override template = 'autocrm:site/navbar/date-today';
	holiday: any = null;
	year!: number;
	month!: number;
	day!: number;

	override setup() {
		const today = new Date();
		this.year = today.getFullYear();
		this.month = today.getMonth() + 1; // JavaScript months are 0-indexed
		this.day = today.getDate();

		this.fetchTodayHoliday()
			.then(holidayData => {
				this.holiday = holidayData;
				this.reRender();
			})
			.catch(error => {
				console.error('Failed to fetch holiday information:', error);
			});

		this.addActionHandler('navigateToCalendar', () => {
			this.getRouter().navigate('#Calendar', { trigger: true });
		});
	}

	isAvailable() {
		// @ts-expect-error - super.isAvailable() method not defined in base View type
		return super.isAvailable() && this.getPreferences().get('enableHolidayInNavbar') === true;
	}

	override data() {
		return {
			holiday: this.holiday,
			isLoggedInUserHoliday: this.getUser().attributes.firstName === this.holiday?.name,
			year: this.year,
			month: this.month,
			day: this.day,
			messageTodayUser: this.translate('Today holiday user', 'labels', 'Navbar').replace(
				'{name}',
				this.holiday?.name,
			),
			messageTodayPublic: this.translate('Today holiday pubic', 'labels', 'Navbar').replace(
				'{holidayName}',
				this.holiday?.holidayName,
			),
		};
	}

	/**
		 * Fetch today's holiday information
		 * @returns {Promise} Promise that resolves with holiday data
		 */
	fetchTodayHoliday(): Promise<any> {
		return new Promise((resolve, reject) => {
			Espo.Ajax.getRequest(`Holiday/api/${this.year}/${this.month}/${this.day}`)
				.then((response: any) => {
					if (response && response.total > 0) {
						resolve(response.list[0]);
					} else {
						reject(new Error('Invalid holiday data format'));
					}
				})
				.catch(error => {
					console.error('Error fetching holiday data:', error);
					reject(error);
				});
		});
	}
});
