extend(Dep => class extends Dep {
	createView(key, view, options, callback) {
		if (
			options.actionType &&
				this.getMetadata().get(['entityDefs', 'Workflow', 'actionViews'], {})[options.actionType]
		) {
			const viewName = this.getMetadata().get(['entityDefs', 'Workflow', 'actionViews'], {})[
				options.actionType
			];
			return super.createView(key, viewName, options, callback);
		} else {
			return super.createView(key, view, options, callback);
		}
	}
});
