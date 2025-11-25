extend(Dep => class extends Dep {
	template = 'viacrm:admin/entity-manager/index';

	setup() {
		super.setup();

		this.events['click [data-action="removeEntity"]'] = e => {
			const entityType = $(e.currentTarget).data('name');

			this.removeEntity(entityType);
		};
	}

	removeEntity(entityType) {
		this.confirm(this.translate('confirmRemove', 'messages', 'EntityManager'), () => {
			Espo.Ui.notify(this.translate('pleaseWait', 'messages'));

			Espo.Ajax.postRequest('EntityManager/action/removeEntity', { name: entityType }).then(() => {
				this.getMetadata()
					.loadSkipCache()
					.then(() => {
						this.getConfig()
							.load()
							.then(() => {
								Espo.Ui.notify(false);

								this.broadcastUpdate();
								window.location.reload();
							});
					});
			});
		});
	}

	broadcastUpdate() {
		this.getHelper().broadcastChannel.postMessage('update:metadata');
		this.getHelper().broadcastChannel.postMessage('update:settings');
	}
});
