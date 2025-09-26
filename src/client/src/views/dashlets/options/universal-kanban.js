define('viacrm:views/dashlets/options/universal-kanban', ['views/dashlets/options/base'], function (Dep) {

    return Dep.extend({

        setup: function() {
            Dep.prototype.setup.call(this);
            
            // Dynamically populate entity type options
            this.setupEntityTypeField();
        },

        setupEntityTypeField: function() {
            if (!this.fields.entityType) return;
            
            const dynamicEntityList = this.getKanbanEntitiesList();
            const staticOptions = (this.fields.entityType.params && this.fields.entityType.params.options) || [];
            
            // Merge static options with dynamic ones, remove duplicates
            const mergedEntities = staticOptions.concat(dynamicEntityList);
            const allEntities = [];
            const seen = {};
            
            mergedEntities.forEach(entity => {
                if (!seen[entity]) {
                    seen[entity] = true;
                    allEntities.push(entity);
                }
            });
            
            // Update the field definition
            this.fields.entityType.params = this.fields.entityType.params || {};
            this.fields.entityType.params.options = allEntities;
            this.fields.entityType.params.translation = this.getEntityTypeTranslations(allEntities);
            
            console.log('Available entities for Kanban:', allEntities);
        },

        getKanbanEntitiesList: function() {
            const entityList = this.getMetadata().getScopeList() || [];
            const kanbanEntities = [];
            
            console.log('Checking entities for Kanban compatibility:', entityList);
            
            entityList.forEach(entityName => {
                const entityDefs = this.getMetadata().get(['entityDefs', entityName]);
                const scopeDefs = this.getMetadata().get(['scopes', entityName]);
                
                console.log('Checking entity: ' + entityName, {
                    entityDefs: !!entityDefs,
                    fields: entityDefs && entityDefs.fields ? Object.keys(entityDefs.fields) : 'none',
                    scopeDefs: scopeDefs
                });
                
                if (!entityDefs || !entityDefs.fields) {
                    console.log(entityName + ': No entity defs or fields');
                    return;
                }
                
                // Check if entity has any field that could be used for status (enum type)
                const enumFields = Object.keys(entityDefs.fields).filter(fieldName => {
                    const field = entityDefs.fields[fieldName];
                    const isEnum = field.type === 'enum' && field.options && field.options.length > 1;
                    if (isEnum) {
                        console.log(entityName + '.' + fieldName + ': enum field with options:', field.options);
                    }
                    return isEnum;
                });
                
                const hasStatusField = enumFields.length > 0;
                
                // More relaxed scope validation - just check if it's a real entity
                const isValidScope = scopeDefs && 
                                   scopeDefs.entity !== false && 
                                   !scopeDefs.disabled &&
                                   // Only exclude obvious system entities
                                   !entityName.match(/^(User|Team|Role|Portal|Integration|Import|Export|Attachment|Note|Email|EmailTemplate|EmailFilter|EmailAccount|InboundEmail|Job|ScheduledJob|AuthToken|ActionHistoryRecord|ArrayValue|Autofollow|Cleanup|Dashboard|Extension|ExternalAccount|GroupEmailFolder|Layout|Mass|Pdf|Preferences|Settings|Stream|Template|Webhook|LogRecord|PasswordChangeRequest|TwoFactorCode|Currency|Language)$/);
                
                console.log(entityName + ': hasStatusField=' + hasStatusField + ', isValidScope=' + isValidScope + ', enumFields=' + enumFields.length);
                
                if (hasStatusField && isValidScope) {
                    kanbanEntities.push(entityName);
                    console.log('✓ ' + entityName + ' added to Kanban entities');
                }
            });
            
            console.log('Final Kanban entities list:', kanbanEntities);
            
            // Sort alphabetically and ensure common entities are at the top
            const priorityEntities = ['Task', 'Lead', 'Opportunity', 'Case', 'Order', 'Offer', 'Account', 'Contact'];
            const sortedEntities = kanbanEntities.sort(function(a, b) {
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
            
            return sortedEntities.length > 0 ? sortedEntities : ['Task'];
        },

        getEntityTypeTranslations: function(entityList) {
            const translations = {};
            
            entityList.forEach(entityName => {
                // Get translated label for entity
                const label = this.getLanguage().translate(entityName, 'scopeNames') || entityName;
                translations[entityName] = label;
            });
            
            return translations;
        },

        afterRender: function() {
            Dep.prototype.afterRender.call(this);
            
            // Update entity options after render
            setTimeout((function() {
                this.updateEntityTypeOptions();
                this.updateStatusFieldOptions();
            }).bind(this), 100);
            
            // Add listener for entity type changes to update status field options
            this.$el.on('change', 'select[name="entityType"]', (function() {
                this.updateStatusFieldOptions();
            }).bind(this));
        },

        updateEntityTypeOptions: function() {
            const $select = this.$el.find('select[name="entityType"]');
            if ($select.length === 0) return;
            
            const currentValue = $select.val();
            const allEntities = this.getKanbanEntitiesList();
            const translations = this.getEntityTypeTranslations(allEntities);
            
            // Clear current options
            $select.empty();
            
            // Add all entity options
            allEntities.forEach(entityName => {
                const label = translations[entityName] || entityName;
                const option = $('<option></option>')
                    .attr('value', entityName)
                    .text(label);
                
                if (entityName === currentValue) {
                    option.attr('selected', 'selected');
                }
                
                $select.append(option);
            });
            
            console.log('Updated entity dropdown with:', allEntities);
        },

        updateStatusFieldOptions: function() {
            const entityType = this.$el.find('select[name="entityType"]').val();
            if (!entityType) return;
            
            const statusFields = this.getStatusFieldsForEntity(entityType);
            const $statusField = this.$el.find('input[name="statusField"]');
            
            if (statusFields.length > 0) {
                // Set placeholder with suggested field
                $statusField.attr('placeholder', statusFields[0] + ' (doporučeno)');
                
                // Add tooltip with all available fields
                const tooltip = 'Dostupná status pole: ' + statusFields.join(', ');
                $statusField.attr('title', tooltip);
            } else {
                $statusField.attr('placeholder', 'status');
                $statusField.removeAttr('title');
            }
        },

        getStatusFieldsForEntity: function(entityName) {
            const entityDefs = this.getMetadata().get(['entityDefs', entityName]);
            if (!entityDefs || !entityDefs.fields) {
                return [];
            }
            
            const statusFields = Object.keys(entityDefs.fields).filter(fieldName => {
                const field = entityDefs.fields[fieldName];
                return field.type === 'enum' && 
                       field.options && 
                       field.options.length > 1 &&
                       !field.notStorable &&
                       !fieldName.match(/^(type|priority|source|assigned|created|modified)$/i);
            });
            
            // Sort by preference (status-like names first)
            return statusFields.sort(function(a, b) {
                const aIsStatusLike = a.match(/status|stage|state|phase|step/i);
                const bIsStatusLike = b.match(/status|stage|state|phase|step/i);
                
                if (aIsStatusLike && !bIsStatusLike) return -1;
                if (!aIsStatusLike && bIsStatusLike) return 1;
                return a.localeCompare(b);
            });
        }
    });
});