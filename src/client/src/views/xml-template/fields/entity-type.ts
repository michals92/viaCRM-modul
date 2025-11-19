define(['views/fields/entity-type'], Dep => class extends Dep {
	override checkAvailability(entityType) {
		const defs = this.scopesMetadataDefs[entityType] || {};

		if (defs.xmlTemplate) {
			return true;
		}

		if (defs.entity && defs.object) {
			return true;
		}

		return false;
	}
});
