define(['advanced:views/bpmn-process/record/list', 'helpers/mass-action'], (Dep, MassActionHelper) => class extends Dep {
	massActionStop() {
		const count = this.checkedList.length;

		const confirmMsg = this.translate('confirmMassStop', 'messages', 'BpmnProcess').replace(
			'{count}',
			count.toString(),
		);

		this.confirm(
			{
				message: confirmMsg,
				confirmText: this.translate('Yes'),
			},
			() => {
				Espo.Ui.notify(this.translate('pleaseWait', 'messages'));

				const params = this.getMassActionSelectionPostData();
				const helper = new MassActionHelper(this);
				const idle = !!params.searchParams && helper.checkIsIdle(this.collection.total);

				Espo.Ajax.postRequest('MassAction', {
					action: 'stop',
					entityType: this.entityType,
					params,
					idle,
				}).then(_ => {
					let msg = 'massStopResult';

					if (!count) {
						Espo.Ui.warning(this.translate('massStopZeroResult', 'messages'));
					}

					if (count === 1) {
						msg += 'Single';
					}

					Espo.Ui.success(this.translate(msg, 'messages', 'BpmnProcess').replace('{count}', count));
				});
			},
		);
	}
});
