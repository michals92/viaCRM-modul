define('viacrm:views/fields/stock-quantity', ['views/fields/int'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Listen for changes to trigger recalculation
            this.listenTo(this.model, 'change:stockQuantity', function () {
                this.recalculateAvailableStock();
            });
            
            // Listen for successful saves to recalculate
            this.listenTo(this.model, 'sync', function () {
                // Delay to ensure model is updated
                setTimeout(function () {
                    this.recalculateAfterSave();
                }.bind(this), 500);
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            // Also add direct input event listener
            this.$el.find('input').on('input change', function () {
                setTimeout(function () {
                    this.recalculateAvailableStock();
                }.bind(this), 100);
            }.bind(this));
        },

        recalculateAvailableStock: function () {
            if (!this.model.id) {
                return; // Only for existing products
            }
            
            // Get stock quantity from model instead of DOM
            var stockQuantity = parseInt(this.model.get('stockQuantity')) || 0;
            
            // Temporarily update with stock quantity (will be corrected by backend)
            this.model.set('stockQuantity', stockQuantity, {silent: true});
            
            // Call backend to get proper calculation including deductions
            Espo.Ajax.postRequest('ProductsItems/action/getLiveQuantities', {
                productId: this.model.id,
                tempStockQuantity: stockQuantity
            }).then(function (response) {
                // Update with proper calculated value
                this.model.set('availableStockQuantity', response.availableStockQuantity, {silent: true});
                
                // Re-render the availableStockQuantity field
                this.updateAvailableStockField();
            }.bind(this)).catch(function (error) {
                // Fallback: simple calculation without deductions
                var fallbackValue = Math.max(0, stockQuantity);
                this.model.set('availableStockQuantity', fallbackValue, {silent: true});
                this.updateAvailableStockField();
            }.bind(this));
        },

        updateAvailableStockField: function () {
            var parentView = this.getParentView();
            if (parentView && parentView.getFieldView) {
                var availableStockView = parentView.getFieldView('availableStockQuantity');
                if (availableStockView) {
                    availableStockView.reRender();
                }
            }
        },

        recalculateAfterSave: function () {
            if (!this.model.id) {
                return;
            }

            // Call API to recalculate and save the values
            Espo.Ajax.postRequest('ProductsItems/action/recalculateForProduct', {
                productId: this.model.id
            }).then(function (response) {
                // Update model with fresh calculated values
                this.model.set({
                    'orderQuantity': response.orderQuantity,
                    'quoteQuantity': response.quoteQuantity,
                    'availableStockQuantity': response.availableStockQuantity
                }, {silent: true});
                
                // Re-render all calculated fields
                this.updateCalculatedFields();
            }.bind(this)).catch(function (error) {
                // Silent failure - API recalculation will be retried on next change
            }.bind(this));
        },

        updateCalculatedFields: function () {
            var parentView = this.getParentView();
            if (parentView && parentView.getFieldView) {
                ['orderQuantity', 'quoteQuantity', 'availableStockQuantity'].forEach(function (fieldName) {
                    var fieldView = parentView.getFieldView(fieldName);
                    if (fieldView) {
                        fieldView.reRender();
                    }
                });
            }
        }

    });

});