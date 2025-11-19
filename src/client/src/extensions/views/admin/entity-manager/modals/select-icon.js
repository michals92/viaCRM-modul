extend(Dep => class extends Dep {
	setup() {
		super.setup();

		const customIconClasses = (this.getHelper().getAppParam('customIcons') || []).map(
			icon => `custom-icon-${icon}`,
		);

		this.iconList.push(...customIconClasses);
	}
});
