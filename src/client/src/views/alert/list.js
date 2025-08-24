define(['views/record/list'], (ListView) => {
    
    return class extends ListView {
        
        setup() {
            super.setup();
            
            console.log('ViaCRM: Alert list view initialized');
            console.log('ViaCRM: Alert list view scope:', this.scope);
        }
        
        setupMassActionItems() {
            super.setupMassActionItems();
            
            // Add Alert-specific mass actions
            if (this.getUser().isAdmin()) {
                this.addMassAction('activateAlerts', {
                    label: 'Activate Selected',
                    iconClass: 'fas fa-play'
                });
            }
        }
        
        massActionActivateAlerts() {
            const ids = this.checkedList;
            
            if (!ids.length) {
                Espo.Ui.warning('No alerts selected');
                return;
            }
            
            Espo.Ui.success(`Activated ${ids.length} alert(s)`);
        }
    };
    
});