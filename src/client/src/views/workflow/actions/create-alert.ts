define(['advanced:views/workflow/actions/create-notification'], Dep => class extends Dep {
	template: string = 'autocrm:workflow/actions/create-alert';
	type: string = 'createAlert';

	createView(key, view, options, callback) {
		if (
			options.actionType &&
				this.getMetadata().get(['entityDefs', 'Workflow', 'actionModals'], {})[options.actionType]
		) {
			const viewName = this.getMetadata().get(['entityDefs', 'Workflow', 'actionModals'], {})[
				options.actionType
			];
			return super.createView(key, viewName, options, callback);
		} else {
			return super.createView(key, view, options, callback);
		}
	}

});
