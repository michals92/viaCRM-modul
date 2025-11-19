extend(Dep => class extends Dep {
	isConvertable() {
		const hideConvertButton = this.getMetadata().get(['clientDefs', 'Lead', 'hideConvertButton']) || false;

		return super.isConvertable() && !hideConvertButton;
	}
});
