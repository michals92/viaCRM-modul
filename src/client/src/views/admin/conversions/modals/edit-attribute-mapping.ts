define(['views/modals/edit'], Dep => class extends Dep {
	editView = 'autocrm:views/attribute-mapping/record/edit';

	fullFormDisabled = true;

	setup() {
		this.headerText = this.translate('Attribute Mapping', 'labels', 'Admin');

		this.buttonList = [];

		this.buttonList.push({
			name: 'save',
			label: 'Save',
			style: 'primary',
			title: 'Ctrl+Enter',
		});

		this.fullFormDisabled = this.options.fullFormDisabled || this.fullFormDisabled;

		this.layoutName = this.options.layoutName || this.layoutName;

		this.buttonList.push({
			name: 'cancel',
			label: 'Cancel',
			title: 'Esc',
		});

		this.scope = this.scope || this.options.scope || this.options.entityType;
		this.entityType = this.options.entityType || this.scope;
		this.id = this.options.id;

		this.headerHtml = this.composeHeaderHtml();

		if (this.options.headerText !== undefined) {
			this.headerHtml = undefined;
			this.headerText = this.options.headerText;
		}

		this.model = this.options.model;

		this.waitForView('edit');

		this.createRecordView(this.model);
	}

	actionSave() {
		this.model.set(this.getRecordView().fetch());

		const scope = this.model.get('scope');
		const foreignScope = this.model.get('foreignScope');
		const data = this.model.get('actionData');

		this.getHelper().broadcastChannel.postMessage('update:metadata');

		Espo.Ajax.putRequest('ConversionDefs', { scope, foreignScope, data }).then(() => {
			this.close();
			Espo.Ui.success(this.translate('Done'));
		});
	}
});
