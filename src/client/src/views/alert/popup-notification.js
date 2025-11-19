define(['views/popup-notification'], Dep => class extends Dep {
	template = 'autocrm:alert/popup-notification';

	type = 'alert';
	style = 'primary';
	closeButton = true;
	soundPath = 'client/sounds/pop_cork';

	setup() {
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

	data() {
		return {
			...super.data(),
			dateAttribute: this.dateAttribute,
		};
	}

	onCancel() {
		Espo.Ajax.postRequest('Alert/toggleUser', {id: this.notificationData.id});
	}

});
