define(['views/record/kanban-item'], Dep => class extends Dep {
	template = 'autocrm:calendar/calendar-item';

	data() {
		const data = super.data();

		data.eventColor = this.options.eventColor;

		return data;
	}
});
