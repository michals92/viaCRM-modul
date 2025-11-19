extend(Dep => class extends Dep {
	process() {
		const allWorkflows = this.view.getHelper().getAppParam('manualWorkflows') || {};

		const scopeWorkflows = allWorkflows[this.view.scope];

		const originalAddMenuItem = this.view.addMenuItem;
		const addMenuItem = (type, item, toBeginning, doNotReRender) => {
			const workflowId = item.data.id;

			const workflow = scopeWorkflows.find(w => w.id === workflowId);

			if (workflow) {
				item.style = workflow.style;
			}

			originalAddMenuItem.call(this.view, type, item, toBeginning, doNotReRender);
		};

		this.view.addMenuItem = addMenuItem;

		super.process();

		this.view.addMenuItem = originalAddMenuItem;
	}
});
