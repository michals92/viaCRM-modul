define(['views/fields/base'], Dep => class extends Dep {
	detailTemplate = 'autocrm:fields/button';
	editTemplate = 'autocrm:fields/button';
	listTemplate = 'autocrm:fields/button';

	data() {
		const data = super.data();

		data.customLabel = this.model.getFieldParam(this.name, 'customLabel');
		data.style = this.model.getFieldParam(this.name, 'style');
		data.disabled = this.isEditMode();

		return data;
	}

	events = {
		'click [data-action="runWorkflow"]': () => {
			if (this.isEditMode()) {
				return;
			}

			// This.params.workflowId doesn't work here for some reason
			const workflowId = this.model.getFieldParam(this.name, 'workflowId');

			if (!workflowId) {
				Espo.Ui.info(this.translate('workflowNotSelected', 'messages'));
			}

			this.actionRunWorkflow(workflowId);
		},
	};

	fetch() {
		return {};
	}

	actionRunWorkflow(id) {
		const allWorkflows = this.getHelper().getAppParam('manualWorkflows') || {};

		/** @type {Record} */
		const item = (allWorkflows[this.model.entityType] || []).find(it => it.id === id);

		let msg = this.translate('confirmation', 'messages');

		if (item && item.confirmationText) {
			msg = this.getHelper().transformMarkdownText(item.confirmationText).toString();
		}

		if (!item.confirmation) {
			this.process(id);

			return;
		}

		Espo.Ui.confirm(msg, {
			confirmText: this.translate('Yes', 'labels'),
			cancelText: this.translate('No', 'labels'),
			backdrop: true,
			isHtml: true,
		}).then(() => this.process(id));
	}

	/**
		 * @param {string} id
		 */
	process(id) {
		const model = this.model;

		this.disableButton();

		Espo.Ui.notifyWait();

		Espo.Ajax.postRequest('WorkflowManual/action/run', {
			targetId: model.id,
			id,
		})
			.then(() => {
				model.fetch().then(() => {
					Espo.Ui.success(this.translate('Done'));
				});
			})
			.finally(() => this.enableButton());
	}

	disableButton() {
		this.$el.find('[data-action="runWorkflow"]').prop('disabled', true);
	}

	enableButton() {
		this.$el.find('[data-action="runWorkflow"]').prop('disabled', false);
	}
});
