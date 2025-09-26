define('viacrm:views/dashlets/options/universal-kanban', ['views/dashlets/options/base'], function (Dep) {

    return Dep.extend({

        setup: function() {
            Dep.prototype.setup.call(this);
        },

        afterRender: function() {
            Dep.prototype.afterRender.call(this);
            
            // Add listener for entity type changes to update status field helper
            this.$el.on('change', 'select[name="entityType"]', (function() {
                this.updateStatusFieldOptions();
            }).bind(this));
            
            // Initial update of status field helper
            setTimeout((function() {
                this.updateStatusFieldOptions();
            }).bind(this), 100);
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