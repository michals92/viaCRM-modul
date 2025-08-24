define(['views/record/detail'], (DetailView) => {
    
    return class extends DetailView {
        
        setup() {
            super.setup();
            
            console.log('RecordTemplate detail view initialized');
        }
        
        setupActionItems() {
            super.setupActionItems();
            
            // Add RecordTemplate-specific actions
            this.addMenuItem('buttons', {
                name: 'useTemplate',
                label: 'Use Template',
                iconClass: 'fas fa-magic',
                action: 'useTemplate'
            });
        }
        
        actionUseTemplate() {
            const entityType = this.model.get('entityType');
            
            if (!entityType) {
                Espo.Ui.error('No entity type specified for this template');
                return;
            }
            
            Espo.Ui.success(`Using template for ${entityType}`);
            
            // Navigate to create form with template data
            const router = this.getRouter();
            router.navigate(`#${entityType}/create`, {trigger: true});
        }
    };
    
});