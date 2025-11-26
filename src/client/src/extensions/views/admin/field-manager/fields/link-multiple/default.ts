import type _default from 'espocrm/src/views/admin/field-manager/fields/link-multiple/default';

type AutocrmLinkMultipleConstructor = new () => object;

type FieldOptions = {
	field: string;
	scope: string;
};

type FetchData = {
	defaultAttributes: Record<string, unknown> | null;
	[key: string]: unknown;
};

extend<_default>(['viacrm:views/fields/link-multiple'], (_Dep, AutocrmLinkMultiple: AutocrmLinkMultipleConstructor) => class extends /* Dep intentionally left out */ AutocrmLinkMultiple {
	options!: FieldOptions;
	name!: string;
	idsName!: string;
	nameHashName!: string;
	ids!: string[];
	nameHash!: Record<string, string>;
	recordListEnabled!: boolean;
	recordListCreateDisabled!: boolean;
	recordListLinkDisabled!: boolean;
	foreignScope!: string;
	recordListLayout!: string;

	init(): void {
		super.init();

		this.setParams();
	}

	setup(): void {
		super.setup();

		this.listenTo(this.model, 'change:recordListLayout', () => {
			this.setParams();
			this.prepare();
			this.reRender();
		});

		this.listenTo(this.model, 'change:recordListEnabled', () => {
			this.setParams();
			this.prepare();
			this.reRender();
		});

		this.listenTo(this.model, 'change:recordListCreateDisabled', () => {
			this.setParams();
			this.prepare();
			this.reRender();
		});

		this.listenTo(this.model, 'change:recordListLinkDisabled', () => {
			this.setParams();
			this.prepare();
			this.reRender();
		});
	}

	getRecordList(): unknown[] {
		const defaultAttributes = (this.model.get('defaultAttributes') as Record<string, unknown>) || {};

		return (defaultAttributes[this.options.field + 'RecordList'] as unknown[]) || [];
	}

	setParams(): void {
		this.recordListEnabled = (this.model.get('recordListEnabled') as boolean) || false;
		this.recordListCreateDisabled = (this.model.get('recordListCreateDisabled') as boolean) || false;
		this.recordListLinkDisabled = (this.model.get('recordListLinkDisabled') as boolean) || false;

		this.foreignScope = this.getMetadata().get([
			'entityDefs',
			this.options.scope,
			'links',
			this.options.field,
			'entity',
		]) as string;

		this.recordListLayout = this.getFieldManager().getEntityTypeFieldParam(
			this.options.scope,
			this.options.field,
			'recordListLayout',
		) as string;
	}

	fetch(): FetchData {
		const data = super.fetch() as Record<string, unknown>;

		let defaultAttributes: Record<string, unknown> | null = {};

		if (this.model.get('recordListEnabled')) {
			defaultAttributes[this.options.field + 'RecordList'] = data[this.name + 'RecordList'];
		} else {
			defaultAttributes[this.options.field + 'Ids'] = data[this.idsName];
			defaultAttributes[this.options.field + 'Names'] = data[this.nameHashName];

			if (data[this.idsName] === null || ((data[this.idsName] as unknown[]) || []).length === 0) {
				defaultAttributes = null;
			}
		}

		return {
			defaultAttributes,
		};
	}

	copyValuesFromModel(): void {
		const defaultAttributes = (this.model.get('defaultAttributes') as Record<string, unknown>) || {};

		const idValues = (defaultAttributes[this.options.field + 'Ids'] as string[]) || [];
		const nameHash = (defaultAttributes[this.options.field + 'Names'] as Record<string, string>) || {};

		this.ids = idValues;
		this.nameHash = nameHash;
	}
});
