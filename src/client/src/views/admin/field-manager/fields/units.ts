define(['views/fields/array'], Dep => class extends Dep {
	allowCustomOptions = true;

	override setup() {
		super.setup();

		this.setUnits(true);

		this.listenTo(this.model, 'change:physicalQuantity', this.setUnits.bind(this));
	}

	setUnits() {
		let physicalQuantity = this.model.get('physicalQuantity') || 'area';

		if (physicalQuantity) {
			const units = this.getConfig().get(physicalQuantity + 'UnitList');

			if (units && Array.isArray(units)) {
				this.model.set(this.name, units);
			}
		}
	}
});
