define('custom:views/products-items/fields/inventory-actions', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        listTemplate: 'custom:products-items/fields/inventory-actions/list',

        events: {
            'click [data-action="createReceipt"]': 'createReceipt',
            'click [data-action="CreateIssu"]': 'createIssu'
        },

        data: function () {
            return {
                scope: this.model.name,
                id: this.model.id,
                name: this.model.get('name')
            };
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
        },

        createReceipt: function (e) {
            var productId = $(e.currentTarget).data('id');
            var productName = $(e.currentTarget).data('name');
            this.openInventoryModal('receipt', productId, productName);
        },

        createIssu: function (e) {
            var productId = $(e.currentTarget).data('id');
            var productName = $(e.currentTarget).data('name');
            this.openInventoryModal('Issu', productId, productName);
        },

        openInventoryModal: function (movementType, productId, productName) {
            var viewName = 'custom:views/modals/inventory-movement';

            // Získat loan hodnotu z produktu - správný název pole je 'cLoan'
            var productModel = this.model;
            var isLoan = productModel.get('cLoan') || false;

            
            this.createView('inventoryModal', viewName, {
                scope: 'CInventoryMovemant',
                productId: productId,
                productName: productName,
                movementType: movementType,
                isLoan: isLoan
            }, function (view) {
                // Použít EspoCRM standardní event-driven přístup
                this.listenToOnce(view, 'after:save', function () {
                    this.refreshParentCollection();
                }.bind(this));

                view.render();
            }.bind(this));
        },

        refreshParentCollection: function() {
            // Spolehlivý způsob najít rodičovský view s kolekcí
            var currentView = this.getParentView();

            while (currentView) {
                // Hledat list view s kolekcí
                if (currentView.collection && typeof currentView.collection.fetch === 'function') {
                    Espo.Ui.notifyWait();
                    currentView.collection.fetch().then(function() {
                        Espo.Ui.notify();
                    }.bind(this));
                    return;
                }

                // Zkusit najít v hierarchii
                if (currentView.getView && currentView.getView('list')) {
                    var listView = currentView.getView('list');
                    if (listView && listView.collection) {
                        Espo.Ui.notifyWait();
                        listView.collection.fetch().then(function() {
                            Espo.Ui.notify();
                        }.bind(this));
                        return;
                    }
                }

                currentView = currentView.getParentView();
            }

            // Fallback: Zkusit obnovit celou stránku
            if (this.getRouter()) {
                this.getRouter().dispatch(this.scope, null, {
                    isReturn: true,
                    force: true
                });
            }
        },

        getModelFactory: function () {
            return this.getHelper().modelFactory;
        }

    });

});

