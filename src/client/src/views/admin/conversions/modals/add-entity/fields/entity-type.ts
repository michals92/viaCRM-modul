define(['views/fields/multi-enum'], Dep => class extends Dep {
	checkAvailability(entityType) {
		const defs = this.scopesMetadataDefs[entityType] || {};

		if (defs.entity && defs.object) {
			return true;
		}
	}

	override setupOptions() {
		const scopes = (this.scopesMetadataDefs = this.getMetadata().get('scopes'));

		this.params.options = Object.keys(scopes)
			.filter(scope => {
				if (this.checkAvailability(scope)) {
					return true;
				}
			})
			.sort((v1, v2) => this.translate(v1, 'scopeNames').localeCompare(this.translate(v2, 'scopeNames')));

		this.params.options.unshift('');
	}

	override setup() {
		this.params.translation = 'Global.scopeNames';
		this.setupOptions();

		super.setup();
	}
});
