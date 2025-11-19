import type Model from 'espocrm/src/model';
import type { Button as ModalButton } from 'espocrm/src/views/modal';
import type EditRecordView from 'espocrm/src/views/record/edit';

define(['views/modal', 'model'], (Modal, Model) => class extends Modal {
	//@ts-ignore this will always be set for us
	model: Model;

	override templateContent = '<div class="record no-side-margin">{{{record}}}</div>';

	override buttonList: ModalButton[] = [
		{
			name: 'zipAttachments',
			label: 'Zip Attachments',
			labelTranslation: 'Global.labels.Zip Attachments',
			style: 'primary',
		},
		{
			name: 'cancel',
			label: 'Cancel',
		},
	];

	override shortcutKeys = {
		'Control+Enter': 'zipAttachments',
	};

	override setup() {
		super.setup();

		this.model = new Model();
		this.model.name = 'ZipAttachments';

		this.model.setDefs({
			fields: {
				attachmentField: {
					type: 'enum',
					options: this.options.attachmentFields || [],
					view: 'autocrm:views/modals/zip-attachments/fields/attachment-field',
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
								name: 'attachmentField',
							},
							false,
						],
					],
				},
			],
		});
	}

	async actionZipAttachments() {
		const recordView = this.getView<EditRecordView>('record');

		if (!recordView) {
			throw new Error('Record view not found');
		}

		if (recordView.processFetch()) {
			if (recordView.validate()) {
				return;
			}

			this.trigger('done', this.model);
			this.close();
		}
	}
});
