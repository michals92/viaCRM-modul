define(['views/fields/multi-enum'], Dep => class extends Dep {
	override setupOptions() {
		this.params.options = this.getConfig().get('addressCountryListOptions') || [];

		this.translatedOptions = this.getLanguage().get('Settings', 'options', 'addressCountryList') || {};
	}
});
