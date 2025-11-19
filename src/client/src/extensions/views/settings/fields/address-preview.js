extend(['views/fields/address'], (Dep, AddressFieldView) => class extends Dep {
	addressPreviewFields = [
		'addressPreviewStreet',
		'addressPreviewPostalCode',
		'addressPreviewCity',
		'addressPreviewState',
		'addressPreviewCountry',
	];

	setup() {
		AddressFieldView.prototype.setup.call(this);

		const mainModel = this.model;
		const model = mainModel.clone();

		model.entityType = mainModel.entityType;
		model.name = mainModel.name;

		this.addressPreviewFields.forEach(field => {
			model.set(field, this.translate(field, 'addressPreviewFields', 'Settings'));
		});

		this.listenTo(mainModel, 'change:addressFormat', () => {
			model.set('addressFormat', mainModel.get('addressFormat'));

			this.reRender();
		});

		this.model = model;
	}
});
