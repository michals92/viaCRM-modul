/**
 * Related Fields Helper for VIA CRM
 * Handles displaying fields from related entities in list views
 */

define('viacrm:helpers/related-fields', [], function () {
    
    class RelatedFieldsHelper {
        
        constructor() {
            this.relatedFieldsCache = new Map();
            this.entityCache = new Map();
        }
        
        /**
         * Initialize related fields for a view
         */
        initialize(view) {
            if (!view || !view.collection) {
                return;
            }
            
            this.view = view;
            this.entityType = view.entityType || view.scope;
            
            // Get related fields configuration
            this.loadRelatedFieldsConfig();
        }
        
        /**
         * Load related fields configuration from metadata
         */
        loadRelatedFieldsConfig() {
            const metadata = this.view.getMetadata();
            const listDefs = metadata.get(['clientDefs', this.entityType, 'listView']) || {};
            
            // Get VIA CRM related fields configuration
            const relatedFields = listDefs.viaCrmRelatedFields || [];
            
            if (relatedFields.length > 0) {
                this.processRelatedFields(relatedFields);
            }
        }
        
        /**
         * Process related fields configuration
         */
        processRelatedFields(relatedFields) {
            relatedFields.forEach(fieldConfig => {
                this.setupRelatedField(fieldConfig);
            });
        }
        
        /**
         * Setup a single related field
         */
        setupRelatedField(fieldConfig) {
            const {
                name,
                relatedEntity,
                relatedField,
                relationName,
                displayName
            } = fieldConfig;
            
            if (!name || !relatedEntity || !relatedField || !relationName) {
                console.warn('VIA CRM: Invalid related field configuration', fieldConfig);
                return;
            }
            
            // Store configuration
            this.relatedFieldsCache.set(name, fieldConfig);
            
            // Extend view to handle this related field
            this.extendViewForRelatedField(name, fieldConfig);
        }
        
        /**
         * Extend view to handle related field
         */
        extendViewForRelatedField(fieldName, config) {
            if (!this.view.getFieldView) {
                return;
            }
            
            // Override getFieldView for this field
            const originalGetFieldView = this.view.getFieldView.bind(this.view);
            
            this.view.getFieldView = function(name) {
                if (name === fieldName) {
                    return 'viacrm:views/fields/related-field';
                }
                return originalGetFieldView(name);
            };
            
            // Store config for the field view
            this.view.relatedFieldsConfig = this.view.relatedFieldsConfig || {};
            this.view.relatedFieldsConfig[fieldName] = config;
        }
        
        /**
         * Get related field value for a model
         */
        getRelatedFieldValue(model, fieldConfig) {
            const {
                relationName,
                relatedField
            } = fieldConfig;
            
            // Try to get from loaded relations
            const relatedModel = model.get(relationName);
            
            if (relatedModel && typeof relatedModel === 'object') {
                return relatedModel[relatedField] || '';
            }
            
            // If not loaded, try to load it
            return this.loadRelatedFieldValue(model, fieldConfig);
        }
        
        /**
         * Load related field value asynchronously
         */
        async loadRelatedFieldValue(model, fieldConfig) {
            const {
                relatedEntity,
                relationName,
                relatedField
            } = fieldConfig;
            
            try {
                // Get related entity ID
                const relatedId = model.get(relationName + 'Id');
                
                if (!relatedId) {
                    return '';
                }
                
                // Check cache first
                const cacheKey = `${relatedEntity}-${relatedId}-${relatedField}`;
                
                if (this.entityCache.has(cacheKey)) {
                    return this.entityCache.get(cacheKey);
                }
                
                // Load related entity
                const relatedModel = await this.loadRelatedEntity(relatedEntity, relatedId);
                
                if (relatedModel) {
                    const value = relatedModel.get(relatedField);
                    this.entityCache.set(cacheKey, value);
                    return value;
                }
                
                return '';
                
            } catch (error) {
                console.error('VIA CRM: Error loading related field value', error);
                return '';
            }
        }
        
        /**
         * Load related entity
         */
        loadRelatedEntity(entityType, id) {
            return new Promise((resolve) => {
                const model = this.view.getModelFactory().create(entityType);
                model.id = id;
                
                model.fetch({
                    success: () => resolve(model),
                    error: () => resolve(null)
                });
            });
        }
        
        /**
         * Format related field value for display
         */
        formatRelatedFieldValue(value, fieldType, fieldConfig) {
            if (!value) {
                return '';
            }
            
            // Apply formatting based on field type
            switch (fieldType) {
                case 'currency':
                    return this.formatCurrency(value);
                case 'date':
                    return this.formatDate(value);
                case 'datetime':
                    return this.formatDateTime(value);
                case 'enum':
                    return this.formatEnum(value, fieldConfig);
                default:
                    return value;
            }
        }
        
        /**
         * Format currency value
         */
        formatCurrency(value) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(value);
        }
        
        /**
         * Format date value
         */
        formatDate(value) {
            return moment(value).format('YYYY-MM-DD');
        }
        
        /**
         * Format datetime value
         */
        formatDateTime(value) {
            return moment(value).format('YYYY-MM-DD HH:mm');
        }
        
        /**
         * Format enum value
         */
        formatEnum(value, fieldConfig) {
            // Would need to get translated options
            return value;
        }
    }
    
    return RelatedFieldsHelper;
});