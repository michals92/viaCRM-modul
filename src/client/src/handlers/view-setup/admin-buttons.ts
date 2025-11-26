interface MenuItem {
	name: string;
	label: string;
	iconClass: string;
	link?: string;
	action?: string;
}

interface AdminButtonsView {
	scope: string;
	name?: string;
	getUser(): { isAdmin(): boolean };
	getConfig(): { get(key: string): unknown };
	addMenuItem(type: string, item: MenuItem): void;
	actionRebuild?: () => void;
	actionClearCache?: () => void;
}

define(
	[],
	() => class AdminButtonsHandler {
		view: AdminButtonsView;
		scope: string;

		constructor(view: AdminButtonsView) {
			this.view = view;
			this.scope = this.view.scope;
		}

		process(): void {
			console.log('ViaCRM AdminButtons: Processing for scope:', this.scope);

			if (!this.scope) {
				console.log('ViaCRM AdminButtons: No scope, skipping');
				return;
			}

			const isAdmin = this.view.getUser().isAdmin();
			console.log('ViaCRM AdminButtons: User is admin:', isAdmin);

			if (!isAdmin) {
				console.log('ViaCRM AdminButtons: User not admin, skipping');
				return;
			}

			console.log('ViaCRM AdminButtons: Adding admin buttons');
			this.addAdminButtons();
		}

		addAdminButtons(): void {
			this.addEditEntityButton();
			this.addEditLayoutButton();
			this.addEditLabelsButton();
			this.addRebuildButton();
			this.addClearCacheButton();
		}

		addEditEntityButton(): void {
			console.log('ViaCRM AdminButtons: Adding Edit Entity button');
			try {
				this.view.addMenuItem('buttons', {
					name: 'editEntity',
					label: 'Edit Entity',
					iconClass: 'fas fa-tools fa-sm',
					link: '#Admin/entityManager/scope=' + this.scope,
				});
				console.log('ViaCRM AdminButtons: Edit Entity button added successfully');
			} catch (e) {
				console.error('ViaCRM AdminButtons: Error adding Edit Entity button:', e);
			}
		}

		addEditLayoutButton(): void {
			if (!this.view.name) return;

			const layoutType = this.view.name.toLowerCase();
			console.log('ViaCRM AdminButtons: Adding Edit Layout button for type:', layoutType);

			this.view.addMenuItem('buttons', {
				name: 'editLayout',
				label: 'Edit Layout',
				iconClass: 'fas fa-table fa-sm',
				link: '#Admin/layouts/scope=' + this.scope + '&type=' + layoutType,
			});
		}

		addEditLabelsButton(): void {
			const language = (this.view.getConfig().get('language') as string) || 'en_US';

			this.view.addMenuItem('buttons', {
				name: 'editLabels',
				label: 'Edit Labels',
				iconClass: 'fas fa-tags fa-sm',
				link: '#Admin/labelManager/scope=' + this.scope + '&language=' + language,
			});
		}

		addRebuildButton(): void {
			console.log('ViaCRM AdminButtons: Adding Rebuild button');

			this.view.addMenuItem('buttons', {
				name: 'rebuild',
				label: 'Rebuild',
				iconClass: 'fas fa-hammer fa-sm',
				action: 'rebuild',
			});

			this.view.actionRebuild = (): void => {
				this.doRebuild();
			};
		}

		addClearCacheButton(): void {
			console.log('ViaCRM AdminButtons: Adding Clear Cache button');

			this.view.addMenuItem('buttons', {
				name: 'clearCache',
				label: 'Clear Cache',
				iconClass: 'fas fa-broom fa-sm',
				action: 'clearCache',
			});

			this.view.actionClearCache = (): void => {
				this.doClearCache();
			};
		}

		doRebuild(): void {
			console.log('ViaCRM AdminButtons: Executing rebuild');

			Espo.Ui.notify('Rebuilding...');

			Espo.Ajax.postRequest('Admin/rebuild')
				.then(() => {
					Espo.Ui.success('Rebuild completed');
					setTimeout(() => {
						window.location.reload();
					}, 1000);
				})
				.catch((error: unknown) => {
					console.error('Rebuild failed:', error);
					Espo.Ui.error('Rebuild failed');
				});
		}

		doClearCache(): void {
			console.log('ViaCRM AdminButtons: Executing clear cache');

			Espo.Ui.notify('Clearing cache...');

			Espo.Ajax.postRequest('Admin/clearCache')
				.then(() => {
					Espo.Ui.success('Cache cleared');
				})
				.catch((error: unknown) => {
					console.error('Clear cache failed:', error);
					Espo.Ui.error('Clear cache failed');
				});
		}
	},
);
