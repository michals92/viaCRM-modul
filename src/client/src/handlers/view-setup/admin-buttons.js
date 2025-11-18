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
            this.addToggleFieldNamesButton();
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

        addToggleFieldNamesButton() {
            this.view.addMenuItem('buttons', {
                name: 'toggleFieldNames',
                label: 'Interní názvy',
                iconClass: 'fas fa-eye fa-sm',
                action: 'toggleFieldNames'
            });

            this.view.actionToggleFieldNames = () => {
                try {
                    const navToggle = document.getElementById('nav-toggle-field-names');

                    if (navToggle && typeof navToggle.click === 'function') {
                        let stored = 'disabled';
                        try {
                            const fromStorage = window.localStorage.getItem('displayInternalFieldNames');
                            if (fromStorage) {
                                stored = fromStorage;
                            }
                        } catch (e) {
                            // ignore storage errors
                        }

                        const clicks = stored === 'hidden' ? 2 : 1;
                        for (let i = 0; i < clicks; i++) {
                            navToggle.click();
                        }
                        return;
                    }
                } catch (e) {
                    // ignore DOM errors, fallback to direct toggle
                }

                try {
                    const storageKey = 'displayInternalFieldNames';
                    let currentStatus = 'disabled';

                    try {
                        const stored = window.localStorage.getItem(storageKey);
                        if (stored) {
                            currentStatus = stored;
                        }
                    } catch (e) {
                        // ignore storage errors
                    }

                    // From the admin button we want a simple on/off toggle:
                    // if not enabled -> enable, otherwise disable.
                    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';

                    try {
                        window.localStorage.setItem(storageKey, newStatus);
                    } catch (e) {
                        // ignore storage errors
                    }

                    if (window && typeof window.dispatchEvent === 'function') {
                        window.dispatchEvent(new CustomEvent('displayInternalFieldNamesChanged', {
                            detail: { newValue: newStatus }
                        }));
                    }

                    if (window.Espo && window.Espo.Ui && typeof window.Espo.Ui.success === 'function') {
                        window.Espo.Ui.success(this.view.translate('Done'));
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Error toggling internal field names:', e);
                }
            };
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
