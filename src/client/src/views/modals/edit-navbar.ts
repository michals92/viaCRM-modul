import type EditRecordView from 'espocrm/src/views/record/edit';

define(['views/modal', 'model'], (Modal, Model) =>
	class extends Modal {
		//@ts-ignore this will always be set for us
		model: Model;

		override templateContent = '<div class="record no-side-margin">{{{record}}}</div>';

		override setup() {
			super.setup();

			this.headerText = this.translate('Edit Navbar', 'labels', 'Navbar');

			this.buttonList = [
				{
					name: 'save',
					label: 'Save',
					style: 'primary',
				},
				{
					name: 'cancel',
					label: 'Cancel',
				},
			];

			this.model = new Model();
			this.model.urlRoot = 'Settings';
			this.model.name = 'Settings';

			// Got to have an id to be able to save. The value itself doesn't matter.
			this.model.id = '1';

			this.model.setDefs({
				fields: {
					tabList: {
						type: 'array',
						view: 'views/settings/fields/tab-list',
						validationList: ['array', 'required'],
						mandatoryValidationList: ['array'],
					},
				},
			});

			this.createView('record', 'views/record/edit-for-modal', {
				model: this.model,
				selector: '.record',
				detailLayout: [
					{
						rows: [
							[
								{
									name: 'tabList',
								},
							],
						],
					},
				],
			});

			this.wait(this.model.fetch());
		}

		async actionSave() {
			const recordView = this.getView<EditRecordView>('record')!;

			await recordView.save();

			this.close();
			window.location.reload();
		}
	});
