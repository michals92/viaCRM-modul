define(() => {
    class AdminButtonsHandler {
        constructor(view) {
            this.view = view;
            this.scope = this.view.scope;
        }

        process() {
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

        addAdminButtons() {
            this.addEditEntityButton();
            this.addEditLayoutButton();
            this.addEditLabelsButton();
            this.addRebuildButton();
            this.addClearCacheButton();
        }

        addEditEntityButton() {
            console.log('ViaCRM AdminButtons: Adding Edit Entity button');
            try {
                this.view.addMenuItem('buttons', {
                    name: 'editEntity',
                    label: 'Edit Entity',
                    iconClass: 'fas fa-tools fa-sm',
                    link: '#Admin/entityManager/scope=' + this.scope
                });
                console.log('ViaCRM AdminButtons: Edit Entity button added successfully');
            } catch(e) {
                console.error('ViaCRM AdminButtons: Error adding Edit Entity button:', e);
            }
        }

        addEditLayoutButton() {
            if (!this.view.name) return;
            
            const layoutType = this.view.name.toLowerCase();
            console.log('ViaCRM AdminButtons: Adding Edit Layout button for type:', layoutType);
            
            this.view.addMenuItem('buttons', {
                name: 'editLayout',
                label: 'Edit Layout',
                iconClass: 'fas fa-table fa-sm',
                link: '#Admin/layouts/scope=' + this.scope + '&type=' + layoutType
            });
        }

        addEditLabelsButton() {
            const language = this.view.getConfig().get('language') || 'en_US';
            
            this.view.addMenuItem('buttons', {
                name: 'editLabels',
                label: 'Edit Labels',
                iconClass: 'fas fa-tags fa-sm',
                link: '#Admin/labelManager/scope=' + this.scope + '&language=' + language
            });
        }

        addRebuildButton() {
            console.log('ViaCRM AdminButtons: Adding Rebuild button');
            
            this.view.addMenuItem('buttons', {
                name: 'rebuild',
                label: 'Rebuild',
                iconClass: 'fas fa-hammer fa-sm',
                action: 'rebuild'
            });

            // Add action handler
            this.view.actionRebuild = () => {
                this.doRebuild();
            };
        }

        addClearCacheButton() {
            console.log('ViaCRM AdminButtons: Adding Clear Cache button');
            
            this.view.addMenuItem('buttons', {
                name: 'clearCache',
                label: 'Clear Cache',
                iconClass: 'fas fa-broom fa-sm',
                action: 'clearCache'
            });

            // Add action handler
            this.view.actionClearCache = () => {
                this.doClearCache();
            };
        }

        doRebuild() {
            console.log('ViaCRM AdminButtons: Executing rebuild');
            
            Espo.Ui.notify('Rebuilding...');
            
            Espo.Ajax.postRequest('Admin/rebuild')
                .then(() => {
                    Espo.Ui.success('Rebuild completed');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                })
                .catch((error) => {
                    console.error('Rebuild failed:', error);
                    Espo.Ui.error('Rebuild failed');
                });
        }

        doClearCache() {
            console.log('ViaCRM AdminButtons: Executing clear cache');
            
            Espo.Ui.notify('Clearing cache...');
            
            Espo.Ajax.postRequest('Admin/clearCache')
                .then(() => {
                    Espo.Ui.success('Cache cleared');
                })
                .catch((error) => {
                    console.error('Clear cache failed:', error);
                    Espo.Ui.error('Clear cache failed');
                });
        }
    }

    return AdminButtonsHandler;
});