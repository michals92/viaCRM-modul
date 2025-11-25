define(['view'], Dep => class extends Dep {
	override template = 'viacrm:site/navbar/espo-version';

	override data() {
		return {
			version: this.getConfig().get('version'),
		};
	}

	override setup() {
		if (this.getUser().isAdmin()) {
			this.addActionHandler('showExtensions', () =>
				this.createView('extensionsDialog', 'viacrm:views/modals/extensions').then(view => view.render()),
			);
		}
	}
});
