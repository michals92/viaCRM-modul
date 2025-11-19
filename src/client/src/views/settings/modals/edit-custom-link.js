define(['views/settings/modals/edit-tab-group', 'views/modal', 'model'], (Dep, Modal, Model) => class extends Dep {
	setup() {
		Modal.prototype.setup.call(this);

		this.headerHtml = this.translate('Custom Link', 'labels', 'Settings');

		this.buttonList = [
			{
				name: 'apply',
				label: 'Apply',
				style: 'danger',
			},
			{
				name: 'cancel',
				label: 'Cancel',
			},
		];

		const detailLayout = [
			{
				rows: [
					[
						{
							name: 'text',
							labelText: this.translate('label', 'fields', 'Admin'),
						},
						{
							name: 'iconClass',
							labelText: this.translate('iconClass', 'fields', 'EntityManager'),
						},
						{
							name: 'color',
							labelText: this.translate('color', 'fields', 'EntityManager'),
						},
					],
					[
						{
							name: 'link',
							labelText: this.translate('link', 'fields', 'Settings'),
						},
						false,
					],
				],
			},
		];

		const model = (this.model = new Model());

		model.name = 'CustomLinkTab';

		model.set(this.options.itemData);

		model.setDefs({
			fields: {
				text: {
					type: 'varchar',
				},
				iconClass: {
					type: 'base',
					view: 'views/admin/entity-manager/fields/icon-class',
				},
				color: {
					type: 'base',
					view: 'views/fields/colorpicker',
				},
				link: {
					type: 'url',
					view: 'views/fields/varchar',
				},
			},
		});

		this.createView('record', 'views/record/edit-for-modal', {
			detailLayout,
			model,
			el: this.getSelector() + ' .record',
		});
	}
});
