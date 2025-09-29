define('viacrm:views/fields/dynamic-status-multi-enum', ['views/fields/multi-enum'], function (Dep) {

    return Dep.extend({

        setup: function () {
            // Determine which entity status options to use based on field name
            var sourceEntity;
            if (this.name.includes('order') || this.name.includes('Order')) {
                sourceEntity = 'Order';
            } else if (this.name.includes('offer') || this.name.includes('Offer')) {
                sourceEntity = 'Offer';
            }

            if (sourceEntity) {
                // Get status options from the source entity
                var statusOptions = this.getMetadata().get(['entityDefs', sourceEntity, 'fields', 'status', 'options']);
                
                if (statusOptions && statusOptions.length > 0) {
                    // Use dynamic options from source entity
                    this.params.options = statusOptions;
                    
                    // Build translated options
                    this.translatedOptions = {};
                    statusOptions.forEach(function(option) {
                        this.translatedOptions[option] = this.getLanguage().translateOption(option, 'status', sourceEntity);
                    }, this);
                } else {
                    // Fallback to static options from field definition
                    var fallbackOptions = this.getMetadata().get(['entityDefs', this.scope, 'fields', this.name, 'options']);
                    if (fallbackOptions) {
                        this.params.options = fallbackOptions;
                    }
                }
            }

            // Call parent setup
            Dep.prototype.setup.call(this);
        },

        setupOptions: function () {
            // Don't override options that were set in setup
            if (!this.params.options) {
                this.params.options = this.getMetadata().get(['entityDefs', this.scope, 'fields', this.name, 'options']) || [];
            }
        }

    });

});