define('viacrm:views/products-items/detail', ['views/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Load live quantities when detail view is opened
            this.loadLiveQuantities();
        },

        loadLiveQuantities: function () {
            if (!this.model.id) return;

            Espo.Ajax.postRequest('ProductsItems/action/getLiveQuantities', {
                productId: this.model.id
            }).then(function (response) {
                // Update model with live values (display only)
                this.model.set({
                    orderQuantity: response.orderQuantity,
                    quoteQuantity: response.quoteQuantity,
                    availableStockQuantity: response.availableStockQuantity
                }, {silent: true});

                // Re-render fields to show updated values
                this.reRenderQuantityFields();
            }.bind(this)).catch(function () {
                // Silently fail - use stored values
            });
        },

        reRenderQuantityFields: function () {
            var fields = ['orderQuantity', 'quoteQuantity', 'availableStockQuantity'];
            fields.forEach(function (field) {
                var view = this.getFieldView(field);
                if (view) {
                    view.reRender();
                }
            }.bind(this));
        },

        actionRecalculateQuantities: function () {
            this.notify('Recalculating...', 'info');

            Espo.Ajax.postRequest('ProductsItems/action/recalculateForProduct', {
                productId: this.model.id
            }).then(function (response) {
                this.notify('Quantities recalculated and saved successfully', 'success');
                
                // Update model with new values
                this.model.set({
                    orderQuantity: response.orderQuantity,
                    quoteQuantity: response.quoteQuantity,
                    availableStockQuantity: response.availableStockQuantity
                });

                // Re-render quantity fields
                this.reRenderQuantityFields();
            }.bind(this)).catch(function () {
                this.notify('Error occurred during recalculation', 'error');
            }.bind(this));
        }

    });

});