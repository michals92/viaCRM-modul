define('viacrm:views/hr/hr-dynamic-handler', ['dynamic-handler'], function (Dep) {
    
    return class extends Dep {
        
        init() {
            this.controlFields();
            
            // Listen for workingHoursType field changes
            this.recordView.listenTo(this.model, 'change:workingHoursType', () => {
                this.controlFields();
            });
        }
        
        controlFields() {
            const workingHoursType = this.model.get('workingHoursType');
            
            if (workingHoursType === 'Part-time') {
                // Show part-time date fields
                this.recordView.showField('partTimeStartDate');
                this.recordView.showField('partTimeEndDate');
                
            } else if (workingHoursType === 'Full-time') {
                // Hide part-time date fields only
                this.recordView.hideField('partTimeStartDate');
                this.recordView.hideField('partTimeEndDate');
                
            } else {
                // Default state - show part-time date fields
                this.recordView.showField('partTimeStartDate');
                this.recordView.showField('partTimeEndDate');
            }
        }
    };
});