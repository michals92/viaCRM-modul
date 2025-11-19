define(['views/fields/base', 'model'], (Dep, Model) => class extends Dep {
	editTemplate = 'autocrm:admin/field-manager/fields/autoincrement-sequences';

	data() {
		return {
			itemDataList: this.itemDataList,
		};
	}

	setup() {
		this.events['click [data-action="editConditions"]'] = e => {
			var index = parseInt($(e.currentTarget).data('index'));

			this.edit(index);
		};

		this.events['click [data-action="addSequence"]'] = _ => {
			this.addSequence();
		};

		this.events['click [data-action="removeSequence"]'] = e => {
			var index = parseInt($(e.currentTarget).data('index'));
			this.removeItem(index);
		};

		this.optionsDefsList = Espo.Utils.cloneDeep(this.model.get(this.name)) || [];
		this.scope = this.options.scope;

		this.setupItems();
		this.setupItemViews();
	}

	setupItems() {
		this.itemDataList = [];

		this.optionsDefsList.forEach((_, i) => {
			this.itemDataList.push({
				conditionGroupViewKey: 'conditionGroup' + i.toString(),
				key: 'nestedView' + i.toString(),
				index: i,
			});
		});
	}

	setupItemViews() {
		this.optionsDefsList.forEach((_, i) => {
			this.createStringView(i);
			this.createNestedView(i);
		});
	}

	getTranslatedOptions() {
		if (this.model.get('translatedOptions')) {
			return this.model.get('translatedOptions');
		}

		var translatedOptions = {};

		var list = this.model.get('options') || [];

		list.forEach(value => {
			translatedOptions[value] = this.getLanguage().translateOption(
				value,
				this.options.field,
				this.options.scope,
			);
		});

		return translatedOptions;
	}

	createNestedView(num) {
		if (!this.optionsDefsList[num]) {
			return;
		}

		const model = new Model();

		model.entityType = 'Admin';

		model.defs = {
			fields: {
				nextNumber: {
					type: 'int',
					default: 1,
				},
				format: {
					type: 'varchar',
					default: '{YYYY}-{number}',
				},
				padLength: {
					type: 'int',
					default: 5,
				},
			},
		};

		const defs = this.optionsDefsList[num];

		model.set('nextNumber', defs.nextNumber);
		model.set('format', defs.format);
		model.set('padLength', defs.padLength);

		const key = 'nestedView' + num.toString();

		this.createView(
			key,
			'views/record/edit-small',
			{
				model: model,
				selector: '.nested-view-container[data-key="' + key + '"]',
				type: 'editSmall',
				detailLayout: this.getDetailLayout(),
				buttonsDisabled: true,
			},
			view => {
				if (this.isRendered()) {
					view.render();
				}
			},
		);

		this.listenTo(model, 'change', () => {
			this.optionsDefsList[num].nextNumber = model.get('nextNumber');
			this.optionsDefsList[num].format = model.get('format');
			this.optionsDefsList[num].padLength = model.get('padLength');

			this.trigger('change');
		});
	}

	getDetailLayout() {
		return [
			{
				rows: [
					[
						{
							name: 'format',
							label: this.translate('format', 'fields', 'Admin'),
						},
					],
					[
						{
							name: 'nextNumber',
							label: this.translate('nextNumber', 'fields', 'Admin'),
						},
					],
					[
						{
							name: 'padLength',
							label: this.translate('padLength', 'fields', 'Admin'),
						},
					],
				],
			},
		];
	}

	createStringView(num) {
		var key = 'conditionGroup' + num.toString();

		if (!this.optionsDefsList[num]) {
			return;
		}

		this.createView(
			key,
			'views/admin/dynamic-logic/conditions-string/group-base',
			{
				selector: '.string-container[data-key="' + key + '"]',
				itemData: {
					value: this.optionsDefsList[num].conditionGroup,
				},
				operator: 'and',
				scope: this.scope,
			},
			view => {
				if (this.isRendered()) {
					view.render();
				}
			},
		);
	}

	edit(num) {
		this.createView(
			'modal',
			'views/admin/dynamic-logic/modals/edit',
			{
				conditionGroup: this.optionsDefsList[num].conditionGroup,
				scope: this.options.scope,
			},
			view => {
				view.render();

				this.listenTo(view, 'apply', conditionGroup => {
					this.optionsDefsList[num].conditionGroup = conditionGroup;

					this.trigger('change');

					this.createStringView(num);
				});
			},
		);
	}

	addSequence() {
		this.optionsDefsList.push({
			conditionGroup: null,
			nextNumber: 1,
			format: '{YYYY}-{number}',
			padLength: 5,
		});

		this.setupItems();
		this.reRender();
		this.setupItemViews();

		this.trigger('change');
	}

	removeItem(num) {
		this.optionsDefsList.splice(num, 1);

		this.setupItems();
		this.clearView('nestedView' + this.optionsDefsList.length);
		if (this.isRendered()) {
			this.reRender();
		}
		this.setupItemViews();

		this.trigger('change');
	}

	fetch() {
		const data = {};

		data[this.name] = this.optionsDefsList;

		if (!this.optionsDefsList.length) {
			data[this.name] = null;
		}

		return data;
	}
});
