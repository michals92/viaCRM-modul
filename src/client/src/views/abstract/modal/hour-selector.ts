import type Model from 'espocrm/src/model';

define(['views/modal', 'model'], (Modal, Model: Model) => class extends Modal {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	model: Model;
	override templateContent = '<div class="record no-side-margin">{{{record}}}</div>';

	override setup() {
		super.setup();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.model = new Model();
		this.model.name = 'HourSelector';
		this.model.setDefs({
			fields: {
				hours: {
					type: 'int',
					default: 6,
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
								name: 'hours',
							},
							false,
						],
					],
				},
			],
		});

		this.buttonList.push({
			name: 'save',
			label: 'Save',
			style: 'primary',
			title: 'Ctrl+Enter',
			onClick: () => this.actionSave(),
		});
	}

	actionSave() {
		const hours: number = this.model.get('hours') || 6;
		const ids = this.options.ids as string[] | null;

		if (ids) {
			this.syncImap(hours, ids);
		}
	}

	syncImap(hours: number, ids: any) {
		Espo.Ui.notifyWait();

		Espo.Ajax.postRequest(`Mail/Account/${this.options.endpointName}/syncImap`, {
			ids,
			hours,
		}).then(() => {
			Espo.Ui.success(this.translate('imapSyncedSuccess', 'messages', 'Email'));

			Espo.Ui.notifyWait();
			this.close();
		});
	}
});
