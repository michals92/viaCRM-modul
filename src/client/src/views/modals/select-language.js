define(['autocrm:views/modals/simple-select'], Dep => class extends Dep {
	setup() {
		const languageList = this.getMetadata().get(['app', 'language', 'list']) || [];
		const translatedOptions = this.getLanguage().translate('language', 'options') || {};

		this.itemList = languageList.map(language => ({
			value: language,
			label: translatedOptions[language] || language,
		}));

		this.headerText = this.translate('Select Language', 'labels');

		super.setup();
	}
});
