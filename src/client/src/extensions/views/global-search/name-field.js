extend(Dep => class extends Dep {
	data() {
		return {
			...super.data(),
			name: this.getDisplayName(),
		};
	}

	getDisplayName() {
		const displayFields = this.getMetadata().get(
			['clientDefs', this.model.get('_scope'), 'globalSearchDisplayFields'],
			[],
		);

		if (displayFields.length) {
			const complex = displayFields.reduce((str, field) => {
				const type = this.getMetadata().get([
					'entityDefs',
					this.model.get('_scope'),
					'fields',
					field,
					'type',
				]);

				let value = this.model.get(field);

				// TODO: support more types
				switch (type) {
					case 'link':
						value = str + ' ' + this.model.get(field + 'Name');
						break;
				}

				if (value) {
					return str + ' ' + value;
				}

				return str;
			}, '');

			if (complex) {
				return complex;
			}
		}

		return this.model.get('name') || this.translate('None');
	}
});
