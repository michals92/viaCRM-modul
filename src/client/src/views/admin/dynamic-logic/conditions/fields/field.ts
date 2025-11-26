define(['views/fields/enum'], Dep => class extends Dep {
	getFieldList() {
		let fields = this.getMetadata().get(['entityDefs', this.options.scope, 'fields'], {});

		let filterList = Object.keys(fields).filter(field => {
			let fieldType = fields[field].type || null;

			if (fields[field].disabled || fields[field].utility) {
				return;
			}

			if (!fieldType) {
				return;
			}

			if (!this.getMetadata().get(['clientDefs', 'DynamicLogic', 'fieldTypes', fieldType])) {
				return;
			}

			return true;
		});

		filterList.push('id');

		filterList.sort((v1, v2) => this.translate(v1, 'fields', this.options.scope).localeCompare(
			this.translate(v2, 'fields', this.options.scope),
		));

		return filterList;
	}

	setupTranslation() {
		this.translatedOptions = {};

		this.params.options.forEach(item => {
			this.translatedOptions[item] = this.translate(item, 'fields', this.options.scope);
		});
	}

	override setupOptions() {
		this.params.options = this.getFieldList();
	}
});
