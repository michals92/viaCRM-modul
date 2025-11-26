define(['views/fields/base'], Dep => class extends Dep {
	override editTemplate = 'autocrm:attribute-mapping/fields/attribute-mapping/edit';

	declare events = {
		'click [data-action="addField"]': () => {
			this.createView(
				'modal',
				/* This view is already exactly what we want, no need to copy the code to a new one */
				'autocrm:views/attribute-mapping/action-modals/add-field',
				{
					scope: this.model.get('foreignScope'),
				},
				view => {
					view.render();

					this.listenToOnce(view, 'add-field', field => {
						view.close();

						if (!~this.actionData.fieldList.indexOf(field)) {
							this.actionData.fieldList.push(field);
							this.actionData.fields[field] = {};

							this.addField(field, false, true);
						}
					});
				},
			);
		},
		'click [data-action="removeField"]': e => {
			const $target = $(e.currentTarget);
			const field = $target.data('field');

			this.clearView('field-' + field);

			delete this.actionData.fields[field];

			const index = this.actionData.fieldList.indexOf(field);
			if (index > -1) {
				this.actionData.fieldList.splice(index, 1);
			}

			$target.parent().remove();
		},
	};

	override data() {
		const data = super.data();

		return {
			...data,
			fieldList: this.actionData.fieldList,
			scope: this.scope,
			foreignScope: this.model.get('foreignScope'),
		};
	}

	override setup() {
		super.setup();

		this.actionData = this.options.actionData || {};

		this.actionDataInitial = Espo.Utils.cloneDeep(this.actionData);

		this.actionData = this.model.get('actionData');
		this.entityType = this.options.entityType;

		this.wait(true);

		this.getModelFactory().create(this.model.get('foreignScope'), model => {
			(this.actionData.fieldList || []).forEach(field => {
				const fieldDef = this.actionData.fields[field];

				if (
					fieldDef.subjectType === 'value' &&
						fieldDef.attributes &&
						typeof fieldDef.attributes === 'object'
				) {
					model.set(fieldDef.attributes);
				}
			});

			this.fakeModel = model;

			(this.actionData.fieldList || []).forEach(field => {
				this.addField(field, this.actionData.fields[field], false);
			});

			this.wait(false);
		});
	}

	override afterRender() {
		super.afterRender();

		this.$fieldDefinitions = this.$el.find('.field-definitions');
	}

	fieldDefinitions = {
		date: 'date',
		datetime: 'date',
		datetimeOptional: 'date',
		jsonArray: 'wide',
	};

	addField(field, fieldData, afterRender = true) {
		const fieldType =
				this.getMetadata().get(['entityDefs', this.model.get('foreignScope'), 'fields', field, 'type']) ||
				'base';

		const type = this.fieldDefinitions[fieldType] || 'base';

		fieldData = fieldData || {};

		const escapedField = this.getHelper().escapeString(field);

		if (afterRender) {
			const $fieldName = $('<label>').text(
				this.translate(escapedField, 'fields', this.model.get('foreignScope')),
			);

			const $removeLink = $('<a>', {
				role: 'button',
				tabindex: 0,
				class: 'pull-right',
				'data-action': 'removeField',
				'data-field': escapedField,
			}).append($('<span>').addClass('fas fa-times'));

			const $fieldContainer = $('<div>', {
				class: 'field-container field',
				'data-field': escapedField,
			});

			const $fieldRow = $('<div>', {
				class: 'margin clearfix field-row',
				'data-field': escapedField,
				style: 'margin-left: 20px;',
			}).append($removeLink, $fieldName, $fieldContainer);

			this.$fieldDefinitions.append($fieldRow);
		}

		this.createView(
			'field-' + field,
			'autocrm:views/attribute-mapping/field-definitions/' + Espo.Utils.camelCaseToHyphen(type),
			{
				el: this.options.el + ' .field-container[data-field="' + field + '"]',
				fieldData,
				model: this.fakeModel,
				field,
				entityType: this.model.get('scope'),
				scope: this.model.get('scope'),
				type,
				fieldType,
				isNew: true,
			},
			view => {
				if (afterRender) {
					view.render();
				}
			},
		);
	}

	getFieldList() {
		const fieldDefs = this.getMetadata().get(['entityDefs', this.scope, 'fields']) || {};

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

				return !~['currencyConverted', 'autoincrement', 'map', 'foreign'].indexOf(type);
			})
			.sort((v1, v2) =>
				this.translate(v1, 'fields', this.scope).localeCompare(this.translate(v2, 'fields', this.scope)),
			);
	}

	override validate() {
		return false;
	}

	override fetch() {
		(this.actionData.fieldList || []).forEach(field => {
			const fieldView = this.getView('field-' + field);

			if (fieldView) {
				fieldView.fetch();
				this.actionData.fields[field] = fieldView.fieldData;
			}
		});

		return this.actionData;
	}
});
