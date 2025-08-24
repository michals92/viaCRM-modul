/**
 * Enhanced Layout Manager for VIA CRM
 * Extends the standard EspoCRM Layout Manager with additional functionality
 */

define('viacrm:views/admin/layout-manager', ['views/admin/layout-manager'], function (Dep) {
    
    return Dep.extend({
        
        template: 'viacrm:admin/layout-manager',
        
        data: function () {
            const data = Dep.prototype.data.call(this);
            
            // Add VIA CRM specific data
            data.viaCrmFeatures = {
                relatedFields: true,
                relatedPanels: true,
                editableFields: true,
                customLayouts: true
            };
            
            return data;
        },
        
        setup: function () {
            Dep.prototype.setup.call(this);
            
            console.log('VIA CRM Enhanced Layout Manager loaded');
            
            // Add VIA CRM layout types
            this.addViaCrmLayoutTypes();
            
            // Extend layout options
            this.extendLayoutOptions();
        },
        
        /**
         * Add VIA CRM specific layout types
         */
        addViaCrmLayoutTypes: function () {
            // Add custom layout types if not already present
            const customTypes = [
                {
                    name: 'listRelated',
                    label: 'List (Related Fields)',
                    description: 'List view with related entity fields'
                },
                {
                    name: 'detailPanels', 
                    label: 'Detail (With Panels)',
                    description: 'Detail view with custom panels'
                }
            ];
            
            // Store for later use
            this.viaCrmLayoutTypes = customTypes;
        },
        
        /**
         * Extend layout options with VIA CRM features
         */
        extendLayoutOptions: function () {
            // Override field options to include VIA CRM features
            this.listenTo(this, 'field-options-show', (fieldName, options) => {
                this.addViaCrmFieldOptions(fieldName, options);
            });
        },
        
        /**
         * Add VIA CRM specific field options
         */
        addViaCrmFieldOptions: function (fieldName, options) {
            // Add editable option for list views
            if (this.type === 'list') {
                options.editable = {
                    type: 'bool',
                    label: 'Editable',
                    tooltip: 'Make this field editable in list view'
                };
            }
            
            // Add related field options
            options.related = {
                type: 'bool', 
                label: 'Related Field',
                tooltip: 'Show field from related entity'
            };
            
            if (options.related) {
                options.relatedEntity = {
                    type: 'varchar',
                    label: 'Related Entity',
                    tooltip: 'Name of related entity'
                };
                
                options.relatedField = {
                    type: 'varchar',
                    label: 'Related Field', 
                    tooltip: 'Field name in related entity'
                };
            }
            
            // Add formula field option
            options.formula = {
                type: 'bool',
                label: 'Formula Field',
                tooltip: 'Calculate field value using formula'
            };
            
            if (options.formula) {
                options.formulaExpression = {
                    type: 'text',
                    label: 'Formula Expression',
                    tooltip: 'Formula expression to calculate value'
                };
            }
        },
        
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            // Add VIA CRM UI enhancements
            this.addViaCrmEnhancements();
        },
        
        /**
         * Add VIA CRM specific UI enhancements
         */
        addViaCrmEnhancements: function () {
            // Add VIA CRM branding
            const $header = this.$el.find('h3').first();
            if ($header.length) {
                $header.append(' <span class="viacrm-brand">(VIA Enhanced)</span>');
            }
            
            // Add feature indicators
            this.addFeatureIndicators();
        },
        
        /**
         * Add feature indicators to the layout manager
         */
        addFeatureIndicators: function () {
            const features = [
                { name: 'Related Fields', icon: '🔗', active: true },
                { name: 'Editable Fields', icon: '✏️', active: true },
                { name: 'Formula Fields', icon: 'ƒ', active: true },
                { name: 'Custom Panels', icon: '📋', active: true }
            ];
            
            const $indicators = $('<div class="viacrm-features-indicators"></div>');
            
            features.forEach(feature => {
                const $indicator = $(`
                    <span class="viacrm-feature-indicator ${feature.active ? 'active' : 'inactive'}" 
                          title="${feature.name}">
                        ${feature.icon} ${feature.name}
                    </span>
                `);
                $indicators.append($indicator);
            });
            
            // Add to layout manager
            const $container = this.$el.find('.layout-manager-content').first();
            if ($container.length) {
                $container.prepend($indicators);
            }
        }
        
    });
});