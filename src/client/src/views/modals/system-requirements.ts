define(['views/modal'], Dep => class extends Dep {
	override template = 'autocrm:modals/system-requirements';
	
	override className = 'dialog dialog-record';
	
	override backdrop = true;
	
	fitHeight = true;

	override setup() {
		this.headerText = this.translate('System Requirements', 'labels', 'Admin');

		this.buttonList = [
			{
				name: 'close',
				label: 'Close',
			},
		];

		// Hack: we get the original template and trim off the top 4 lines that we do not want.
		const templatePromise = Espo.loader.requirePromise<string>('res!client/res/templates/admin/system-requirements/index.tpl')
			.then(template => {
				const split = template.split('\r\n');

				split.splice(0, 4);

				return split.join('\r\n');
			});

		this.wait(
			templatePromise.then(template => {
				this.createView('systemRequirements', 'autocrm:views/modals/system-requirements/system-requirements', {
					el: this.getSelector() + ' .system-requirements-container',
					template
				});
			})
		);
	}
});