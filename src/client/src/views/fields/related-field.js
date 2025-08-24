/**
 * Related Field View for VIA CRM
 * Displays field value from a related entity
 */

define('viacrm:views/fields/related-field', ['views/fields/base'], function (Dep) {
    
    return Dep.extend({
        
        type: 'relatedField',
        
        listTemplate: 'viacrm:fields/related-field/list',
        detailTemplate: 'viacrm:fields/related-field/detail',
        
        data: function () {
            const data = Dep.prototype.data.call(this);
            
            data.relatedValue = this.getRelatedValue();
            data.relatedConfig = this.getRelatedConfig();
            data.isEmpty = !data.relatedValue;
            
            return data;
        },
        
        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Get related field configuration
            this.relatedConfig = this.getRelatedConfig();
            
            if (!this.relatedConfig) {
                console.warn('VIA CRM: No related field config found for', this.name);
                return;
            }
            
            // Set up field properties
            this.setupRelatedField();
            
            // Load related value
            this.loadRelatedValue();
        },
        
        /**
         * Get related field configuration
         */
        getRelatedConfig: function () {
            if (this.options.relatedConfig) {
                return this.options.relatedConfig;
            }
            
            // Try to get from parent view
            if (this.model && this.model.relatedFieldsConfig) {
                return this.model.relatedFieldsConfig[this.name];
            }
            
            // Try to get from parent view
            const parentView = this.getParentView();
            if (parentView && parentView.relatedFieldsConfig) {
                return parentView.relatedFieldsConfig[this.name];
            }
            
            return null;
        },
        
        /**
         * Setup related field properties
         */
        setupRelatedField: function () {
            const config = this.relatedConfig;
            
            if (!config) {
                return;
            }
            
            // Set display name
            this.displayName = config.displayName || config.name;
            
            // Set field type for formatting
            this.relatedFieldType = config.relatedFieldType || 'varchar';
            
            // Add CSS class
            this.addCssClass = 'viacrm-related-field';
        },
        
        /**
         * Load related field value
         */
        loadRelatedValue: function () {
            if (!this.relatedConfig || !this.model) {
                return;
            }
            
            const config = this.relatedConfig;
            const relationName = config.relationName;
            const relatedField = config.relatedField;
            
            // Try to get from model attributes first
            const relatedId = this.model.get(relationName + 'Id');
            const relatedName = this.model.get(relationName + 'Name');
            
            if (relatedId) {
                this.loadRelatedEntity(config.relatedEntity, relatedId, relatedField);
            } else {
                this.relatedValue = '';
            }
        },
        
        /**
         * Load related entity and extract field value
         */
        loadRelatedEntity: function (entityType, id, fieldName) {
            // Create related model
            const relatedModel = this.getModelFactory().create(entityType);
            relatedModel.id = id;
            
            // Fetch the related entity
            relatedModel.fetch({
                success: () => {
                    this.relatedValue = relatedModel.get(fieldName);
                    this.reRender();
                },
                error: () => {
                    this.relatedValue = '';
                    console.warn('VIA CRM: Failed to load related entity', entityType, id);
                }
            });
        },
        
        /**
         * Get the current related value
         */
        getRelatedValue: function () {
            if (this.relatedValue !== undefined) {
                return this.formatRelatedValue(this.relatedValue);
            }
            
            return '';
        },
        
        /**
         * Format related value based on field type
         */
        formatRelatedValue: function (value) {
            if (!value) {
                return '';
            }
            
            const fieldType = this.relatedFieldType;
            
            switch (fieldType) {
                case 'currency':
                    return this.getHelper().formatCurrency(value);
                case 'date':
                    return this.getDateTime().toDisplayDate(value);
                case 'datetime':
                    return this.getDateTime().toDisplay(value);
                case 'int':
                case 'float':
                    return this.getHelper().formatNumber(value);
                case 'bool':
                    return value ? '✓' : '✗';
                default:
                    return String(value);
            }
        },
        
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            // Add tooltip with related entity info
            if (this.relatedConfig && this.$el) {
                const tooltip = `Related field from ${this.relatedConfig.relatedEntity}`;
                this.$el.attr('title', tooltip);
                this.$el.addClass('viacrm-related-field');
            }
        }
        
    });
});