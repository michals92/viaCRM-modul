define(['views/fields/multi-enum'], (Dep) => class extends Dep {
	readTypeList = [
		'rightClickPreview',
		'combinedView'
	];

	override setupOptions() {
		this.params.options = [];
		this.translatedOptions = {};

		this.readTypeList.forEach(type => {
			this.params.options.push(type);
			this.translatedOptions[type] = this.getLanguage().translateOption(type, 'readTypeList', 'Preferences');
		});
	}
});
