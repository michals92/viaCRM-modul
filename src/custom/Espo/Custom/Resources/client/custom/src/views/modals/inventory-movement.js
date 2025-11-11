define('custom:views/modals/inventory-movement', ['views/modals/edit'], function (Dep) {

    return Dep.extend({

        scope: 'CInventoryMovemant',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.header = (this.options.movementType === 'receipt' ? 'Příjemka' : 'Výdejka') + ' - ' + this.options.productName;

            // Nastavit výchozí hodnoty
            this.model.set({
                name: (this.options.movementType === 'receipt' ? 'Příjemka' : 'Výdejka') + ' - ' + this.options.productName + ' - ' + new Date().toLocaleString(),
                productId: this.options.productId,
                productName: this.options.productName,
                movemantType: this.options.movementType,
                loan: this.options.isLoan || false,
                assignedUserId: this.getUser().id,
                assignedUserName: this.getUser().get('name')
            });

            // Nastavit produkt relaci a loan pole po inicializaci modelu
            setTimeout(function() {
                if (this.model.set) {
                    this.model.set('product', this.options.productId);
                    this.model.set('productId', this.options.productId);
                    this.model.set('productName', this.options.productName);
                    this.model.set('loan', this.options.isLoan || false);
                }
            }.bind(this), 100);
        },

        setupBeforeFinal: function () {
            Dep.prototype.setupBeforeFinal.call(this);

            // Znovu nastavit loan pole pro jistotu
            this.model.set('loan', this.options.isLoan || false);

            // Skrýt nepotřebná pole pro rychlý přístup
            var hiddenFields = ['createdAt', 'modifiedAt', 'createdBy', 'modifiedBy'];
            hiddenFields.forEach(function(field) {
                this.hideField(field);
            }, this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
        },

        getButtonList: function () {
            return [
                {
                    name: 'save',
                    label: 'Uložit',
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: 'Zrušit',
                    html: '<span class="fas fa-times"></span>'
                },
                {
                    name: 'close',
                    label: 'Zavřít',
                    html: '<span class="fas fa-times"></span>',
                    onClick: function() {
                        this.close();
                    }.bind(this)
                }
            ];
        },

        actionSave: function () {
            // Validace počtu kusů
            var amount = this.model.get('amount');
            if (!amount || amount < 1) {
                this.notify('Počet kusů musí být větší než 0', 'error');
                return;
            }

            Dep.prototype.actionSave.call(this);
        },

        afterSave: function () {
            // Standardní EspoCRM afterSave metoda - volá se po úspěšném uložení
            Dep.prototype.afterSave.call(this);

            // Spustit after:save event - EspoCRM standard
            this.trigger('after:save', this.model);
        },

        actionCancel: function () {
            Dep.prototype.actionCancel.call(this);
        },

        close: function() {
            Dep.prototype.close.call(this);
        }

    });

});

