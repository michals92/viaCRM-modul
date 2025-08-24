define(['views/record/list'], (ListView) => {
    
    return class extends ListView {
        
        setup() {
            super.setup();
            
            console.log('RecordTemplate list view initialized');
        }
        
        setupMassActionItems() {
            super.setupMassActionItems();
            
            // Add RecordTemplate-specific mass actions
            this.addMassAction('exportTemplates', {
                label: 'Export Templates',
                iconClass: 'fas fa-download'
            });
        }
        
        massActionExportTemplates() {
            const ids = this.checkedList;
            
            if (!ids.length) {
                Espo.Ui.warning('No templates selected');
                return;
            }
            
            Espo.Ui.success(`Exporting ${ids.length} template(s)`);
        }
    };
    
});