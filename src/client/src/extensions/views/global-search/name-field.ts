import type GlobalSearchNameFieldView from 'espocrm/src/views/global-search/name-field';

type NameFieldData = {
	name: string;
	[key: string]: unknown;
};

extend<GlobalSearchNameFieldView>(Dep => class extends Dep {
	override data(): NameFieldData {
		return {
			...super.data(),
			name: this.getDisplayName(),
		};
	}

	getDisplayName(): string {
		const displayFields = this.getMetadata().get(
			['clientDefs', this.model.get('_scope'), 'globalSearchDisplayFields'],
			[],
		) as string[];

		if (displayFields.length) {
			const complex = displayFields.reduce((str: string, field: string) => {
				const type = this.getMetadata().get([
					'entityDefs',
					this.model.get('_scope'),
					'fields',
					field,
					'type',
				]) as string | null;

				let value = this.model.get(field) as string | null;

				switch (type) {
					case 'link':
						value = str + ' ' + (this.model.get(field + 'Name') as string);
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

		return (this.model.get('name') as string) || this.translate('None');
	}
});
