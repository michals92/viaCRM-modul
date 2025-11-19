define(['views/fields/enum'], Dep => class extends Dep {
	setupOptions() {
		const scope = this.model.get('name');
		const listViewModeList = this.getMetadata().get(['clientDefs', scope, 'listViewModeList']) || ['list'];

		this.params.options = listViewModeList;
	}

	setupTranslation() {
		this.translatedOptions = {};

		for (const option of this.params.options) {
			this.translatedOptions[option] = this.getLanguage().translate(option, 'listViewModes');
		}
	}
});