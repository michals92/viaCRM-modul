define(['views/fields/enum'], Dep => class extends Dep {
	override setupOptions() {
		const scope = this.model.get('name');
		const detailViewModeList = this.getMetadata().get(['clientDefs', scope, 'detailViewModeList']) || ['detail'];

		this.params.options = detailViewModeList;
	}

	setupTranslation() {
		this.translatedOptions = {};

		for (const option of this.params.options) {
			this.translatedOptions[option] = this.getLanguage().translate(option, 'detailViewModes');
		}
	}
});