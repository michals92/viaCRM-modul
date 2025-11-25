define(['views/modal'], ModalView => class extends ModalView {
	protected override className = 'edit-layout';
	protected override template = 'viacrm:admin/layouts/modal-layout';
	protected override backdrop = true;

	protected override async setup(): Promise<void> {
		const view = await this.createView('content', 'viacrm:views/admin/layouts/index-single', {
			scope: this.options.scope,
			type: this.options.type,
		});

		this.listenTo(this.getHelper().layoutManager, 'sync', () => this.trigger('after:save'));

		await view.render();
	}
});
