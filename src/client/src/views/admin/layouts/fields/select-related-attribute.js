define(['views/fields/multi-enum'], Dep => class extends Dep {
	getItemList() {
		const itemList = [];
		this.entityType = this.options.scope;
		const links = this.links || this.getMetadata().get(['entityDefs', this.entityType, 'links']) || {};

		const linkList = Object.keys(links).sort((v1, v2) => (this.translatedLinks[v1] || this.translate(v1, 'links', this.entityType)).localeCompare(
			this.translatedLinks[v2] || this.translate(v2, 'links', this.entityType),
		));

		const enabledAttributesSet = new Set();
		this.options.enabledFields.forEach(field => {
			enabledAttributesSet.add(field.name);
		});

		linkList.forEach(link => {
			if (!links[link]) {
				return;
			}

			const type = links[link].type;
			if (type !== 'belongsTo') return;

			const scope = links[link].entity;
			if (!scope) return;

			const fields =
					this.fields[scope] || Object.keys(this.getMetadata().get('entityDefs.' + scope + '.fields') || {});
			fields.sort((v1, v2) => (
				(this.translatedFields[scope] && this.translatedFields[scope][v1]) ||
						this.translate(v1, 'fields', scope)
			).localeCompare(
				(this.translatedFields[scope] && this.translatedFields[scope][v2]) ||
							this.translate(v2, 'fields', scope),
			));
			fields.forEach(item => {
				const key = link + '.' + item;

				if (!enabledAttributesSet.has(key)) {
					itemList.push(key);
				}
			});
		});

		return itemList;
	}

	setupTranslatedOptions() {
		this.translatedOptions = this.translatedOptions || {};

		this.params.options.forEach(item => {
			const field = item.split('.')[1];
			const link = item.split('.')[0];
			const scope = this.getMetadata().get(['entityDefs', this.entityType, 'links', link, 'entity']);
			this.translatedOptions[item] =
					(this.translatedLinks[link] || this.translate(link, 'links', this.entityType)) +
					' > ' +
					((this.translatedFields[scope] && this.translatedFields[scope][field]) ||
						this.translate(field, 'fields', scope));
		});
	}

	setupOptions() {
		super.setupOptions();

		this.params.options = this.getItemList();
		this.setupTranslatedOptions();
	}

	afterRender() {
		super.afterRender();

		if (this.$element && this.$element[0] && this.$element[0].selectize) {
			this.$element[0].selectize.focus();
		}
	}

	fetch() {
		const data = {};
		const list = this.$element.val().split(this.itemDelimiter);

		if (!list.length) {
			return data;
		}

		data[this.name] = list[0];
		data[this.name + 'Translated'] = this.translatedOptions[list[0]];

		return data;
	}
});
