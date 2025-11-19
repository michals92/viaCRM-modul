define(['views/fields/bool'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.listenTo(this.model, 'change:readOnly', this.manageVisibility);

		this.manageVisibility();
	}

	manageVisibility() {
		if (this.model.get('readOnly')) {
			this.hide();
		} else {
			this.show();
		}
	}
});
