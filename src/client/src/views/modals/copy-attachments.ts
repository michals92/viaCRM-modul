import type EditRecordView from 'espocrm/src/views/record/edit';
import type EnumFieldView from 'espocrm/src/views/fields/enum';
import type { Button as ModalButton } from 'espocrm/src/views/modal';

define(['views/modal', 'model'], (Modal, Model) => class extends Modal {
	//@ts-ignore this will always be set for us
	model: Model;

	override templateContent = '<div class="record no-side-margin">{{{record}}}</div>';

	override buttonList: ModalButton[] = [
		{
			name: 'copyAttachments',
			label: 'Copy Attachments',
			labelTranslation: 'Global.labels.Copy Attachments',
			style: 'primary',
		},
		{
			name: 'cancel',
			label: 'Cancel',
		},
	];

	override shortcutKeys = {
		'Control+Enter': 'copyAttachments',
	};

	override setup() {
		super.setup();

		this.model = new Model();
		this.model.name = 'CopyAttachments';

		this.model.setDefs({
			fields: {
				createNew: {
					type: 'bool',
					default: false,
				},
				entity: {
					type: 'linkParent',
					entityList: this.options.entityList || [],
					view: 'autocrm:views/modals/copy-attachments/fields/entity',
				},
				attachmentField: {
					type: 'enum',
					options: [],
					view: 'autocrm:views/modals/copy-attachments/fields/attachment-field',
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
								name: 'createNew',
							},
							{
								name: 'entity',
							},
						],
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

		this.listenTo(this.model, 'change:entityType', this.updateAttachmentFieldOptions);

		// Inicializace políček při počátečním načtení
		this.once('after:render', () => {
			const entityType = this.model.get('entityType');
			if (entityType) {
				this.updateAttachmentFieldOptions();
			}
		});
	}

	async actionCopyAttachments() {
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

	updateAttachmentFieldOptions() {
		const entityType = this.model.get<string>('entityType');

		if (!entityType) {
			this.model.set('attachmentField', null);
			return;
		}

		const fields = this.getMetadata().get(['entityDefs', entityType, 'fields']) || {};

		const attachmentFields = Object.keys(fields).filter(
			fieldName => fields[fieldName].type === 'attachmentMultiple' || fields[fieldName].type === 'file',
		);

		this.model.set('attachmentField', null);

		const recordView = this.getView<EditRecordView>('record');

		if (recordView) {
			const fieldView = recordView?.getFieldView<EnumFieldView>('attachmentField');

			if (fieldView) {
				fieldView.params.options = attachmentFields;
				fieldView.setupOptions();
				fieldView.reRender();
			}
		}
	}
});
