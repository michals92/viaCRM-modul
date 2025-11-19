extend(['autocrm:views/fields/link-multiple'], (_Dep, AutocrmLinkMultiple) => class extends /* Dep intentionally left out */ AutocrmLinkMultiple {
	init() {
		super.init();

		this.setParams();
	}

	setup() {
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

	getRecordList() {
		const defaultAttributes = this.model.get('defaultAttributes') || {};

		return defaultAttributes[this.options.field + 'RecordList'] || [];
	}

	setParams() {
		this.recordListEnabled = this.model.get('recordListEnabled') || false;
		this.recordListCreateDisabled = this.model.get('recordListCreateDisabled') || false;
		this.recordListLinkDisabled = this.model.get('recordListLinkDisabled') || false;

		this.foreignScope = this.getMetadata().get([
			'entityDefs',
			this.options.scope,
			'links',
			this.options.field,
			'entity',
		]);

		this.recordListLayout = this.getFieldManager().getEntityTypeFieldParam(
			this.options.scope,
			this.options.field,
			'recordListLayout',
		);
	}

	fetch() {
		const data = super.fetch();

		let defaultAttributes = {};

		if (this.model.get('recordListEnabled')) {
			defaultAttributes[this.options.field + 'RecordList'] = data[this.name + 'RecordList'];
		} else {
			defaultAttributes[this.options.field + 'Ids'] = data[this.idsName];
			defaultAttributes[this.options.field + 'Names'] = data[this.nameHashName];

			if (data[this.idsName] === null || (data[this.idsName] || []).length === 0) {
				defaultAttributes = null;
			}
		}

		return {
			defaultAttributes,
		};
	}

	copyValuesFromModel() {
		const defaultAttributes = this.model.get('defaultAttributes') || {};

		const idValues = defaultAttributes[this.options.field + 'Ids'] || [];
		const nameHash = defaultAttributes[this.options.field + 'Names'] || {};

		this.ids = idValues;
		this.nameHash = nameHash;
	}
});
