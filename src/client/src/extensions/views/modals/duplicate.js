extend(Dep => class extends Dep {
	setup() {
		let saveLabel = 'Save';

		if (this.model && this.model.isNew()) {
			saveLabel = 'Create';
		}

		const hasCreateButton = !this.getMetadata().get([
			'clientDefs',
			this.options.scope,
			'duplicateCheckCreateButtonDisabled',
		]);

		if (hasCreateButton) {
			this.buttonList = [
				{
					name: 'save',
					label: saveLabel,
					style: 'danger',
					onClick: dialog => {
						this.trigger('save');

						dialog.close();
					},
				},
				{
					name: 'cancel',
					label: 'Cancel',
				},
			];
		} else {
			this.buttonList = [
				{
					name: 'cancel',
					label: 'Cancel',
				},
			];
		}

		this.scope = this.options.scope;
		this.duplicates = this.options.duplicates;

		if (this.scope) {
			this.setupRecord();
		}
	}
});
