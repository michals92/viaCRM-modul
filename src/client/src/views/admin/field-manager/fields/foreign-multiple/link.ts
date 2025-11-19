define(['views/fields/enum'], Dep => class extends Dep {
	override setup() {
		super.setup();

		if (!this.model.isNew()) {
			this.setReadOnly(true);
		}
	}

	override setupOptions() {
		const links = this.getMetadata().get(['entityDefs', this.options.scope as string, 'links']) || {};

		this.params.options = Object.keys(Espo.Utils.clone(links)).filter(item => {
			if (['belongsTo', 'hasOne'].includes(links[item].type)) {
				return false;
			}

			if (links[item].noJoin) {
				return false;
			}

			if (links[item].disabled) {
				return false;
			}

			return true;
		});

		const scope = this.options.scope as string;

		this.translatedOptions = {};

		this.params.options.forEach(item => {
			this.translatedOptions[item] = this.translate(item, 'links', scope);
		});

		this.params.options = this.params.options.sort((v1, v2) => this.translate(v1, 'links', scope).localeCompare(this.translate(v2, 'links', scope)));

		this.params.options.unshift('');
	}
});
