import type EntityManagerIndexView from 'espocrm/src/views/admin/entity-manager/index';

extend<EntityManagerIndexView>(Dep => class extends Dep {
	override template = 'viacrm:admin/entity-manager/index';

	override setup(): void {
		super.setup();

		this.events['click [data-action="removeEntity"]'] = (e: Event) => {
			const entityType = $(e.currentTarget as HTMLElement).data('name') as string;

			this.removeEntity(entityType);
		};
	}

	removeEntity(entityType: string): void {
		this.confirm(this.translate('confirmRemove', 'messages', 'EntityManager') as string, () => {
			Espo.Ui.notify(this.translate('pleaseWait', 'messages') as string);

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

	broadcastUpdate(): void {
		this.getHelper().broadcastChannel.postMessage('update:metadata');
		this.getHelper().broadcastChannel.postMessage('update:settings');
	}
});
