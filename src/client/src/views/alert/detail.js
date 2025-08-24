define(['views/record/detail'], (DetailView) => {
    
    return class extends DetailView {
        
        setup() {
            super.setup();
            
            // Add any Alert-specific setup here
            console.log('ViaCRM: Alert detail view initialized');
            console.log('ViaCRM: Alert detail view scope:', this.scope);
            console.log('ViaCRM: Alert detail view model:', this.model);
        }
        
        setupActionItems() {
            super.setupActionItems();
            
            // Add Alert-specific actions
            if (this.getUser().isAdmin()) {
                this.addMenuItem('buttons', {
                    name: 'testAlert',
                    label: 'Test Alert',
                    iconClass: 'fas fa-play',
                    action: 'testAlert'
                });
            }
        }
        
        actionTestAlert() {
            Espo.Ui.success('Alert test triggered!');
        }
    };
    
});