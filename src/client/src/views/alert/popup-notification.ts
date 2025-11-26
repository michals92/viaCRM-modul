define(['views/popup-notification'], Dep => class extends Dep {
	override template = 'autocrm:alert/popup-notification';

	override type = 'alert';
	style = 'primary';
	closeButton = true;
	soundPath = 'client/sounds/pop_cork';

	override setup() {
		if (!this.notificationData.entityType) {
			return;
		}

		const promise = this.getModelFactory().create(this.notificationData.entityType, (model) => {
			const dateAttribute = 'dateStart';

			this.dateAttribute = dateAttribute;

			model.set(dateAttribute, this.notificationData[dateAttribute]);

			this.createView('dateField', 'views/fields/datetime', {
				model: model,
				mode: 'detail',
				selector: '.field[data-name="' + dateAttribute + '"]',
				defs: {
					name: dateAttribute,
				},
				readOnly: true,
			});
		});

		this.wait(promise);
	}

	override data() {
		return {
			...super.data(),
			dateAttribute: this.dateAttribute,
		};
	}

	override onCancel() {
		Espo.Ajax.postRequest('Alert/toggleUser', {id: this.notificationData.id});
	}

});
