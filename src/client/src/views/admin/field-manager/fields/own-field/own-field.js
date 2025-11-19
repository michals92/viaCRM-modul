define(['views/fields/enum'], Dep => class extends Dep {
	setup() {
		super.setup();

		if (!this.model.isNew()) {
			this.setReadOnly(true);
		}

		this.viewValue = this.model.get('view');
	}

	setupOptions() {
		super.setupOptions();

		this.setupOptionsByLink();
	}

	setupOptionsByLink() {
		this.typeList = this.typeList || this.getMetadata().get(['fields', 'foreign', 'fieldTypeList']);

		const scope = this.model.scope;
		const fields = this.fields || this.getMetadata().get(['entityDefs', scope, 'fields']) || {};

		this.params.options = Object.keys(Espo.Utils.clone(fields)).filter(item => {
			const type = fields[item].type;

			if (!~this.typeList.indexOf(type)) {
				return;
			}

			if (fields[item].disabled || fields[item].utility || fields[item].directAccessDisabled) {
				return;
			}

			return true;
		});

		this.translatedOptions = this.translatedOptions || {};

		this.params.options.forEach(item => {
			this.translatedOptions[item] = this.translatedOptions[item] || this.translate(item, 'fields', scope);
		});

		this.params.options = this.params.options.sort((v1, v2) => (this.translatedOptions[v1] || this.translate(v1, 'fields', scope)).localeCompare(
			this.translatedOptions[v2] || this.translate(v2, 'fields', scope),
		));

		this.params.options.unshift('');
	}

	fetch() {
		const data = super.fetch();

		if (this.model.isNew()) {
			if (this.viewValue) {
				data['view'] = this.viewValue;
			}
		}

		return data;
	}
});
