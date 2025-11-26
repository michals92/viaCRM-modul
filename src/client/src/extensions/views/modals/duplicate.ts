import type DuplicateModalView from 'espocrm/src/views/modals/duplicate';

interface ButtonDef {
	name: string;
	label: string;
	style?: string;
	onClick?: (dialog: { close: () => void }) => void;
}

extend<DuplicateModalView>(Dep => class extends Dep {
	override setup(): void {
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
					onClick: (dialog: { close: () => void }) => {
						this.trigger('save');

						dialog.close();
					},
				},
				{
					name: 'cancel',
					label: 'Cancel',
				},
			] as ButtonDef[];
		} else {
			this.buttonList = [
				{
					name: 'cancel',
					label: 'Cancel',
				},
			] as ButtonDef[];
		}

		this.scope = this.options.scope;
		this.duplicates = this.options.duplicates;

		if (this.scope) {
			this.setupRecord();
		}
	}
});
