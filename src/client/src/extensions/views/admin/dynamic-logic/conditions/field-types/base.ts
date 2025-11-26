import type DynamicLogicConditionFieldTypeBaseView from 'espocrm/src/views/admin/dynamic-logic/conditions/field-types/base';

type SelectModule = {
	init(element: HTMLElement): void;
};

type ItemData = {
	subjectType?: string;
	data?: {
		field?: string;
	};
};

type FakeModel = {
	defs: {
		fields: Record<string, unknown>;
	};
	set(name: string, value: unknown): void;
};

type FieldView = {
	render(): void;
};

type FetchData = {
	subjectType?: string;
	field?: string;
	value?: unknown;
	[key: string]: unknown;
};

type ViewOptions = {
	subjectType: string;
	parentScope: string;
};

extend<DynamicLogicConditionFieldTypeBaseView>(['ui/select'], (Dep, Select: SelectModule) => class extends Dep {
	override template = 'viacrm:admin/dynamic-logic/field-types/base';

	subjectTypeList: string[] = ['value', 'field'];
	subjectType!: string;
	options!: ViewOptions;
	declare itemData?: ItemData;
	fakeModel!: FakeModel;
	$subjectType!: JQuery;

	override setup(): void {
		this.subjectType = this.options.subjectType;

		super.setup();
	}

	override populateValues(): void {
		super.populateValues();
		if (this.itemData?.subjectType === 'field') {
			this.model.set('value', this.itemData?.data?.field); //auto-select saved value on edit
		}
		this.fakeModel.set('subjectType', this.subjectType);
	}

	override createModel(): Promise<unknown> {
		return super.createModel().then((model: unknown) => {
			this.getModelFactory().create('Fake', (fakeModel: FakeModel) => {
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

	override manageValue(): void {
		if (this.subjectType === 'value') {
			super.manageValue();
		} else {
			this.createView(
				'value',
				'viacrm:views/admin/dynamic-logic/conditions/fields/field',
				{
					name: 'value',
					selector: '.value-container',
					model: this.model,
					mode: 'edit',
					scope: this.options.parentScope,
				},
				(view: FieldView) => {
					if (this.isRendered()) {
						view.render();
					}
				},
			);
		}
	}

	override afterRender(): void {
		super.afterRender();

		this.$subjectType = this.$el.find('select[data-name="subjectType"]');

		Select.init(this.$subjectType.get(0) as HTMLElement);

		this.$subjectType.on('change', () => {
			this.subjectType = this.$subjectType.val() as string;

			this.manageValue();
		});
	}

	getSubjectTranslatedOptions(): Record<string, string> {
		return this.subjectTypeList.reduce((p: Record<string, string>, it: string) => ({
			...p,
			[it]: this.getLanguage().translateOption(it, 'subjectType', 'Global') as string,
		}), {});
	}

	override fetch(): FetchData {
		const data = super.fetch() as FetchData;

		if (this.subjectType === 'field') {
			data.subjectType = this.subjectType;

			data.field = this.model.get('value') as string;

			delete data.value;
		}

		return data;
	}
});
