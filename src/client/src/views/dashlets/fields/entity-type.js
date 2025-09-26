define('viacrm:views/dashlets/fields/entity-type', ['views/fields/enum'], function (Dep) {

    return Dep.extend({

        setup: function () {
            // Get all available entities dynamically
            const entityList = this.getKanbanEntitiesList();
            
            // Set the options for the enum field
            this.params.options = entityList;
            
            // Create translation object for entity labels
            this.translatedOptions = {};
            entityList.forEach(entityName => {
                const label = this.getLanguage().translate(entityName, 'scopeNames') || entityName;
                this.translatedOptions[entityName] = label;
            });
            
            Dep.prototype.setup.call(this);
        },
        
        getKanbanEntitiesList: function() {
            const entityList = this.getMetadata().getScopeList() || [];
            const kanbanEntities = [];
            
            entityList.forEach(entityName => {
                const entityDefs = this.getMetadata().get(['entityDefs', entityName]);
                const scopeDefs = this.getMetadata().get(['scopes', entityName]);
                
                if (!entityDefs || !entityDefs.fields) return;
                
                // Check if entity has any enum field for status tracking
                const hasEnumField = Object.keys(entityDefs.fields).some(fieldName => {
                    const field = entityDefs.fields[fieldName];
                    return field.type === 'enum' && field.options && field.options.length > 1;
                });
                
                // Include entity if it has enum fields and is not a system entity
                const isValidEntity = scopeDefs && 
                                     scopeDefs.entity !== false && 
                                     !scopeDefs.disabled &&
                                     !scopeDefs.notStorable &&
                                     !entityName.match(/^(User|Team|Role|Portal|Integration|Import|Export|Attachment|Note|Email|EmailTemplate|EmailFilter|EmailAccount|InboundEmail|Job|ScheduledJob|AuthToken|ActionHistoryRecord|ArrayValue|Autofollow|Cleanup|Dashboard|Extension|ExternalAccount|GroupEmailFolder|Layout|Mass|Pdf|Preferences|Settings|Stream|Template|Webhook|LogRecord|PasswordChangeRequest|TwoFactorCode|Currency|Language|ProductsItems)$/);
                
                if (hasEnumField && isValidEntity) {
                    kanbanEntities.push(entityName);
                }
            });
            
            // Sort with priority entities first
            const priorityEntities = ['Task', 'Lead', 'Opportunity', 'Case', 'Order', 'Offer', 'Account', 'Contact', 'Absence', 'Hr', 'Attendance', 'Report'];
            return kanbanEntities.sort((a, b) => {
                const aPriority = priorityEntities.indexOf(a);
                const bPriority = priorityEntities.indexOf(b);
                
                if (aPriority !== -1 && bPriority !== -1) {
                    return aPriority - bPriority;
                } else if (aPriority !== -1) {
                    return -1;
                } else if (bPriority !== -1) {
                    return 1;
                } else {
                    return a.localeCompare(b);
                }
            });
        }
    });
});