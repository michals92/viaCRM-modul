define(['views/modal'], Dep => class extends Dep {
	override template = 'autocrm:email-template/modals/create';

	override setup() {
		this.buttonList = [
			{
				name: 'cancel',
				label: 'Cancel',
			},
		];

		this.header = this.translate('Create EmailTemplate', 'labels', 'EmailTemplate');
	}

	actionCreate(data: any) {
		this.trigger('create', {
			type: data.type,
		});
	}
});
