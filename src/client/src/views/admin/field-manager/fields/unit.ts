define(['views/fields/enum'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.setUnits(true);

		this.listenTo(this.model, 'change:physicalQuantity', this.setUnits.bind(this));
	}

	setUnits(useDefault = false) {
		let physicalQuantity = this.model.get('physicalQuantity');

		if (!physicalQuantity && useDefault) {
			physicalQuantity = 'area';
		}

		if (physicalQuantity) {
			const units = this.getConfig().get(physicalQuantity + 'UnitList');

			if (units && Array.isArray(units)) {
				this.setOptionList(units);
			}
		}
	}
});
