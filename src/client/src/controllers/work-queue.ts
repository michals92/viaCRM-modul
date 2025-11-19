define(['controller'], Dep => class extends Dep {
	override checkAccess() {
		return true;
	}

	actionIndex() {
		this.handleCheckAccess('');

		this.collectionFactory.create('WorkQueue').then(collection => {
			this.main('autocrm:views/work-queue', {
				collection,
				// kanban setup throws an error if statusField is not set, it's easier to just set it to a dummy value than override the whole setup method
				statusField: '__STUB__',
			});
		});
	}
});
