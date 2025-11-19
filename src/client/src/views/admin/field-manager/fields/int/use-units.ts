define(['views/fields/bool'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.manageUnitsFieldVisibility();

		this.listenTo(this.model, 'change:useUnits', this.manageUnitsFieldVisibility.bind(this));
	}

	override afterRender() {
		super.afterRender();

		this.manageUnitsFieldVisibility();
	}

	manageUnitsFieldVisibility() {
		const func = this.model.get('useUnits') ? 'showField' : 'hideField';

		const parentView = this.getParentView();

		if (parentView) {
			['physicalQuantity', 'unit'].forEach(field => {
				parentView[func](field);
			});
		}
	}
});
