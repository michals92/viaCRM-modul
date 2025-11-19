define(['view'], Dep => class extends Dep {
	override template = 'autocrm:site/navbar/espo-version';

	override data() {
		return {
			version: this.getConfig().get('version'),
		};
	}

	override setup() {
		if (this.getUser().isAdmin()) {
			this.addActionHandler('showExtensions', () =>
				this.createView('extensionsDialog', 'autocrm:views/modals/extensions').then(view => view.render()),
			);
		}
	}
});
