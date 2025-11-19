define(['views/fields/enum'], Dep => class extends Dep {
	setupOptions() {
		const emailFolders = this.getHelper().getAppParam('emailFolders') || [];

		this.params.options = ['all', ...emailFolders.map(folder => folder.id)];

		this.translatedOptions = { all: this.translate('All') };

		emailFolders.forEach(folder => (this.translatedOptions[folder.id] = folder.name));
	}
});
