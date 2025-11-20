extend(['ui/select'], (Dep, Select) => class extends Dep {
	template = 'autocrm:admin/dynamic-logic/field-types/base';

	subjectTypeList = ['value', 'field'];

	setup() {
		this.subjectType = this.options.subjectType;

		super.setup();
	}

	populateValues() {
		super.populateValues();
		if (this.itemData?.subjectType === 'field') {
			this.model.set('value', this.itemData?.data?.field); //auto-select saved value on edit
		}
		this.fakeModel.set('subjectType', this.subjectType);
	}

	createModel() {
		return super.createModel().then(model => {
			this.getModelFactory().create('Fake', fakeModel => {
				fakeModel.defs = {
					fields: {},
				};

				this.fakeModel = fakeModel;

				fakeModel.set('subjectType', this.subjectType);

				this.createView('subjectTypeField', 'views/fields/enum', {
					name: 'subjectType',
					selector: '[data-field="subjectType"]',
					model: fakeModel,
					mode: 'edit',
					params: {
						options: this.subjectTypeList,
					},
					translatedOptions: this.getSubjectTranslatedOptions(),
				});
			});
			return model;
		});
	}

	manageValue() {
		if (this.subjectType === 'value') {
			super.manageValue();
		} else {
			this.createView(
				'value',
				'autocrm:views/admin/dynamic-logic/conditions/fields/field',
				{
					name: 'value',
					selector: '.value-container',
					model: this.model,
					mode: 'edit',
					scope: this.options.parentScope,
				},
				view => {
					if (this.isRendered()) {
						view.render();
					}
				},
			);
		}
	}

	afterRender() {
		super.afterRender();

		this.$subjectType = this.$el.find('select[data-name="subjectType"]');

		Select.init(this.$subjectType.get(0));

		this.$subjectType.on('change', () => {
			this.subjectType = this.$subjectType.val();

			this.manageValue();
		});
	}

	getSubjectTranslatedOptions() {
		return this.subjectTypeList.reduce((p, it) => ({
			...p,
			[it]: this.getLanguage().translateOption(it, 'subjectType', 'Global'),
		}), {});
	}

	fetch() {
		const data = super.fetch();

		if (this.subjectType === 'field') {
			data.subjectType = this.subjectType;

			data.field = this.model.get('value');

			delete data.value;
		}

		return data;
	}
});
