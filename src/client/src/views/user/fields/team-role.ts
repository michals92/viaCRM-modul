define(['views/fields/enum'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.listenTo(this.model.collection.parentModel, 'change:positionList', () => {
			// Setup the new options
			this.setupOptions();
			this.setupTranslation();
			// Inits autocomplete with the new options
			this.reRender();
		});
	}

	override setupOptions() {
		if (this.model.collection && this.model.collection.parentModel) {
			this.params.options = Espo.Utils.clone(this.model.collection.parentModel.get('positionList')) || [];
		}
		this.params.options.unshift('');
	}

	setupTranslation() {
		this.translatedOptions = {};
		this.params.options.forEach(
			position =>
				(this.translatedOptions[position] = this.getLanguage().translateOption(
					position,
					'positionList',
					'Team',
				)),
		);
	}
});
