define(['views/dashlets/fields/records/entity-type'], Dep => class extends Dep {
	setupOptions() {
		super.setupOptions();

		this.params.options = this.params.options.filter(scope => this.getMetadata().get(['clientDefs', scope, 'kanbanViewMode'], false));
	}
});
