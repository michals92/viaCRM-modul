define('viacrm:views/fields/stock-quantity', ['views/fields/int'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Listen for changes to trigger recalculation
            this.listenTo(this.model, 'change:stockQuantity', function () {
                console.log('Stock quantity changed, triggering recalculation');
                this.recalculateAvailableStock();
            });
            
            // Listen for successful saves to recalculate
            this.listenTo(this.model, 'sync', function () {
                console.log('Model synced after save, recalculating');
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
                console.log('Input changed directly');
                setTimeout(function () {
                    this.recalculateAvailableStock();
                }.bind(this), 100);
            }.bind(this));
        },

        recalculateAvailableStock: function () {
            console.log('recalculateAvailableStock called');
            if (!this.model.id) {
                console.log('No model ID, skipping recalculation');
                return; // Only for existing products
            }
            
            // Get stock quantity from model instead of DOM
            var stockQuantity = parseInt(this.model.get('stockQuantity')) || 0;
            console.log('Stock quantity:', stockQuantity);
            
            // Temporarily update with stock quantity (will be corrected by backend)
            this.model.set('stockQuantity', stockQuantity, {silent: true});
            
            // Call backend to get proper calculation including deductions
            console.log('Calling API with productId:', this.model.id);
            Espo.Ajax.postRequest('ProductsItems/action/getLiveQuantities', {
                productId: this.model.id,
                tempStockQuantity: stockQuantity
            }).then(function (response) {
                console.log('API response:', response);
                // Update with proper calculated value
                this.model.set('availableStockQuantity', response.availableStockQuantity, {silent: true});
                
                // Re-render the availableStockQuantity field
                this.updateAvailableStockField();
            }.bind(this)).catch(function (error) {
                console.error('API error:', error);
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
            console.log('recalculateAfterSave called');
            if (!this.model.id) {
                console.log('No model ID, skipping post-save recalculation');
                return;
            }

            // Call API to recalculate and save the values
            Espo.Ajax.postRequest('ProductsItems/action/recalculateForProduct', {
                productId: this.model.id
            }).then(function (response) {
                console.log('Post-save recalculation response:', response);
                // Update model with fresh calculated values
                this.model.set({
                    'orderQuantity': response.orderQuantity,
                    'quoteQuantity': response.quoteQuantity,
                    'availableStockQuantity': response.availableStockQuantity
                }, {silent: true});
                
                // Re-render all calculated fields
                this.updateCalculatedFields();
            }.bind(this)).catch(function (error) {
                console.error('Post-save recalculation error:', error);
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