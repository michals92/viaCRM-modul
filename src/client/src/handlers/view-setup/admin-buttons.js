define(() => {
    class AdminButtonsHandler {
        constructor(view) {
            this.view = view;
            this.scope = this.view.scope;
        }

        process() { 
            if (!this.scope) {
                return;
            }

            const isAdmin = this.view.getUser().isAdmin();

            if (!isAdmin) {
                return;
            }
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

            try {
                this.view.addMenuItem('buttons', {
                    name: 'editEntity',
                    label: 'Edit Entity',
                    iconClass: 'fas fa-tools fa-sm',
                    link: '#Admin/entityManager/scope=' + this.scope
                });
            } catch(e) {
            }
        }

        addEditLayoutButton() {
            if (!this.view.name) return;
            
            const layoutType = this.view.name.toLowerCase();            
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