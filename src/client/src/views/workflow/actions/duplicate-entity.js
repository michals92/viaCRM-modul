define(['advanced:views/workflow/actions/update-entity'], Dep => class extends Dep {
	type = 'duplicateEntity';

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
