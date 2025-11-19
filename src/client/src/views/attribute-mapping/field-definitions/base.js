define(['view'], Dep => class extends Dep {
	template = 'autocrm:attribute-mapping/field-definitions/base';

	defaultFieldData = {
		subjectType: 'value',
		attributes: {},
	};

	subjectTypeList = ['value', 'field'];

	events = {
		'change [name="subjectType"]': function (e) {
			this.fieldData.subjectType = e.currentTarget.value;
			this.handleSubjectType();
		},
	};

	data() {
		return {
			subjectTypeList: this.subjectTypeList,
			subjectTypeValue: this.fieldData.subjectType,
		};
	}

	setup() {
		this.scope = this.options.scope;
		this.entityType = this.options.entityType;
		this.field = this.options.field;

		this.fieldData = this.options.fieldData || {};

		if (this.options.isNew) {
			var cloned = {};

			for (var i in this.defaultFieldData) {
				cloned[i] = Espo.Utils.clone(this.defaultFieldData[i]);
			}

			this.fieldData = _.extend(cloned, this.fieldData);
		}

		this.fieldType = this.model.getFieldType(this.field) || 'base';
	}

	afterRender() {
		this.handleSubjectType();
	}

	handleSubjectType() {
		if (this.fieldData.subjectType === 'field') {
			this.createView(
				'subject',
				'autocrm:views/attribute-mapping/action-fields/subjects/field',
				{
					el: this.options.el + ' .subject',
					model: this.model,
					entityType: this.entityType,
					scope: this.scope,
					field: this.field,
					value: this.fieldData.field,
				},
				view => {
					view.render();
				},
			);
		} else if (this.fieldData.subjectType === 'value') {
			const viewName =
					this.model.getFieldParam(this.field, 'view') || this.getFieldManager().getViewName(this.fieldType);

			this.createView(
				'subject',
				viewName,
				{
					el: this.options.el + ' .subject',
					model: this.model,
					defs: {
						name: this.field,
						params: {},
					},
					mode: 'edit',
					readOnly: this.readOnly,
					readOnlyDisabled: true,
				},
				function (view) {
					view.render();
				},
			);
		}
	}

	fetch() {
		this.fieldData.attributes = {};

		if (this.fieldData.subjectType === 'value') {
			const subjectView = this.getView('subject');

			if (subjectView) {
				subjectView.fetchToModel();

				if (subjectView.validate()) {
					return false;
				}

				this.fieldData.attributes = subjectView.fetch();
			}
		} else if (this.fieldData.subjectType === 'field') {
			this.fieldData.field = this.$el.find('[name="subject"]').val();
		}

		return true;
	}
});
