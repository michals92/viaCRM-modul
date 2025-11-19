define(['views/fields/multi-enum'], Dep => class extends Dep {
	setupOptions() {
		this.params.options = this.getConfig().get('calendarEntityList') || [];
	}
});
