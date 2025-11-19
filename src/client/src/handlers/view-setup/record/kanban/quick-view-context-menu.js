define(['autocrm:helpers/quick-view-context-menu'], QuickViewHelper => class {
	constructor(view) {
		this.view = view;
	}

	process() {
		new QuickViewHelper().register(this.view, '.item');
	}
});
