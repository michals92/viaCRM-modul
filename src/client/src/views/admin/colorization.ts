define(['views/record/edit'], Dep => class extends Dep {

	declare detailLayout = [
		{
			rows: [
				[
					{ name: 'rules', noLabel: true }
				]
			]
		}
	];

	/**
	 * Save colorization rules to metadata
	 */
	saveColorizationRules() {
		const rules = this.model.get('rules');

		const data = {
			entityType: this.scope,
			rules
		};

		Espo.Ui.notify(' ... ');

		Espo.Ajax.putRequest('ColorizationDefs', data)
			.then(_response => {
				Espo.Ui.notify(false);

				Promise.all([
					this.getMetadata().loadSkipCache(),
					this.getLanguage().loadSkipCache(),
				]).then(() => this.trigger('after:save'));

				Espo.Ui.success(this.translate('Saved'));

				this.model.fetchedAttributes = this.model.getClonedAttributes();

				this.broadcastUpdate();
			});
	}

	declare events = {
		'click [data-action="save"]': function() {
			this.actionSave();
		}
	};

	/**
	 * Action method for the save button
	 */
	override actionSave() {
		this.saveColorizationRules();

		const view = this.getView('rules');

		if (view) {
			view.render();
		}
	}
});
