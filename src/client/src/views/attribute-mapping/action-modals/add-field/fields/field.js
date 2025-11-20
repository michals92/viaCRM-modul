define(['views/admin/dynamic-logic/fields/field'], Dep => class extends Dep {
	getFieldList() {
		const scope = this.options.scope;

		let fieldDefs = this.getMetadata().get(['entityDefs', scope, 'fields']);

		return Object.keys(fieldDefs)
			.filter(field => {
				const type = fieldDefs[field].type;

				if (fieldDefs[field].disabled || fieldDefs[field].utility) {
					return false;
				}

				if (fieldDefs[field].directAccessDisabled) {
					return false;
				}

				if (fieldDefs[field].directUpdateDisabled) {
					return false;
				}

				return !~['currencyConverted', 'autoincrement', 'map', 'foreign', 'number'].indexOf(type);
			})
			.sort((v1, v2) => this.translate(v1, 'fields', scope).localeCompare(this.translate(v2, 'fields', scope)));
	}
});
