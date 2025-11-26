define(['views/record/edit'], Dep => class extends Dep {
	saveAndContinueEditingAction = false;
	saveAndNewAction = false;

	override setup() {
		this.recordTemplateModel = this.options.recordTemplateModel;

		// prevents rewriting metadata, if defs are shallow copied
		this.model.defs = Espo.Utils.cloneDeep(this.model.defs);
		const fieldDefs = this.model.defs.fields || {};

		Object.keys(fieldDefs).forEach(key => {
			fieldDefs[key].required = false;
		});

		fieldDefs.templateName = {
			type: 'varchar',
			required: true,
			trim: true,
			maxLength: 100,
			default: '',
		};

		this.model.set('templateName', this.recordTemplateModel.get('name'));

		this.model.save = () =>
			new Promise((resolve, reject) => {
				const templateName = this.model.get('templateName');
				const isNew = this.recordTemplateModel.isNew();
				const data = this.model.getClonedAttributes();

				delete data.templateName;
				if (isNew) {
					this.recordTemplateModel.set('entityType', this.scope);
				}

				this.recordTemplateModel.set('name', templateName);
				this.recordTemplateModel.set('data', data);
				this.recordTemplateModel
					.save(null, { patch: !isNew })
					.then(() => {
						// Setting model and scope back to template in order to redirect to the correct url
						this.model = this.recordTemplateModel;
						this.scope = this.recordTemplateModel.name;
						resolve();
					})
					.catch(reject);
			});

		super.setup();
	}

	override getGridLayout(callback) {
		super.getGridLayout(gridLayout => {
			if (gridLayout.layout[0].rows[0][0].name !== 'templateNameField') {
				const orgEntityType = this.entityType;
				this.entityType = 'RecordTemplate';

				const convertedLayout = this.convertDetailLayout([
					{
						label: this.translate('Template Settings', 'labels', 'RecordTemplate'),
						rows: [
							[
								{
									name: 'templateName',
									labelText: this.translate('Template Name', 'labels', 'RecordTemplate'),
								},
								false,
							],
						],
					},
				]);

				this.entityType = orgEntityType;
				gridLayout.layout.forEach(panel => {
					let category = 'labels';

					if ('customLabel' in panel) {
						panel.label = panel.customLabel;
						category = 'panelCustomLabels';
					}

					panel.label =
						this.translate('Data', 'labels', 'RecordTemplate') +
						': ' +
						this.translate(panel.label, category, this.entityType);
				});
				gridLayout.layout.unshift(convertedLayout[0]);
			}
			callback(gridLayout);
		});
	}

	exitAfterCancel() {
		if (!this.model.id) {
			return false;
		}

		this.getRouter().navigate('#' + this.recordTemplateModel.name + '/view/' + this.model.id, {
			trigger: false,
		});

		this.getRouter().dispatch(this.recordTemplateModel.name, 'view', {
			id: this.recordTemplateModel.id,
			model: this.recordTemplateModel,
		});

		return true;
	}
});