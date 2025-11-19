define(['autocrm:extensions/views/admin/dynamic-logic/conditions/field-types/base'], (Dep) => class extends Dep {
	getValueFieldName() {
		return this.name;
	}

	getValueViewName() {
		return 'views/fields/link';
	}

	// noinspection JSUnusedGlobalSymbols
	createValueViewContains() {
		this.createLinkValueField();
	}

	// noinspection JSUnusedGlobalSymbols
	createValueViewNotContains() {
		this.createLinkValueField();
	}

	createLinkValueField() {
		const viewName = 'views/fields/link';
		const fieldName = 'link';

		this.createView('value', viewName, {
			model: this.model,
			name: fieldName,
			selector: '.value-container',
			mode: 'edit',
			readOnlyDisabled: true,
			foreignScope: this.getMetadata().get(['entityDefs', this.scope, 'fields', this.field, 'entity']) ||
					this.getMetadata().get(['entityDefs', this.scope, 'links', this.field, 'entity']),
		}, view => {
			if (this.isRendered()) {
				view.render();
			}
		});
	}

	fetch() {
		/** @type {import('views/fields/base').default} */
		const valueView = this.getView('value');

		const item = {
			type: this.type,
			attribute: this.field + 'Ids',
			data: {
				field: this.field,
			},
		};

		if (valueView) {
			valueView.fetchToModel();

			item.value = this.model.get('linkId');

			const values = {};

			values['linkName'] = this.model.get('linkName');
			values['linkId'] = this.model.get('linkId');

			item.data.values = values;
		}

		if (this.subjectType === 'field') {
			item.subjectType = this.subjectType;
			item.field = this.model.get('value') + 'Ids';

			delete item.value;
		}

		return item;
	}
});