define('viacrm:views/fields/offer-items', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        type: 'offerItems',

        listTemplate: 'viacrm:fields/offer-items/list',
        detailTemplate: 'viacrm:fields/offer-items/detail',
        editTemplate: 'viacrm:fields/offer-items/edit',

        events: {
            'click [data-action="addCustomItem"]': function() {
                this.addCustomItem();
            },
            'click [data-action="removeItem"]': function(e) {
                this.removeItem(parseInt($(e.currentTarget).data('index')));
            },
            'click [data-action="selectProduct"]': function(e) {
                this.selectProduct(parseInt($(e.currentTarget).data('index')));
            },
            'click [data-action="clearProduct"]': function(e) {
                this.clearProduct(parseInt($(e.currentTarget).data('index')));
            },
            'change input[data-name]': function() {
                this.updateCalculations();
                this.trigger('change');
            }
        },

        setup: function() {
            Dep.prototype.setup.call(this);
            this.items = this.model.get(this.name) || [];
            
            // Get default VAT rate from config or use 0 as fallback
            this.defaultVat = this.getConfig().get('defaultTaxRate') || 0;
        },

        data: function() {
            var data = Dep.prototype.data.call(this);
            
            this.items = this.model.get(this.name) || [];
            
            data.items = this.items.map(function(item) {
                var quantity = parseFloat(item.quantity) || 1;
                var unitPrice = parseFloat(item.unitPrice) || 0;
                var vat = item.vat !== null && item.vat !== undefined ? parseFloat(item.vat) : this.defaultVat;
                var totalWithoutVat = quantity * unitPrice;
                var vatAmount = totalWithoutVat * (vat / 100);
                var totalWithVat = totalWithoutVat + vatAmount;
                
                return {
                    productId: item.productId || null,
                    productName: item.productName || '',
                    quantity: quantity,
                    unitPrice: unitPrice,
                    vat: vat,
                    totalWithoutVat: totalWithoutVat,
                    vatAmount: vatAmount,
                    totalWithVat: totalWithVat,
                    isCustom: item.isCustom !== undefined ? item.isCustom : !item.productId,  // Use saved isCustom or determine from productId
                    isCatalogProduct: !!item.productId  // true if has productId (from catalog)
                };
            }.bind(this));
            
            var totals = this.calculateTotals(data.items);
            data.totalWithoutVat = totals.totalWithoutVat;
            data.totalVatAmount = totals.totalVatAmount;
            data.totalWithVat = totals.totalWithVat;
            
            return data;
        },

        calculateTotals: function(items) {
            var totalWithoutVat = 0;
            var totalVatAmount = 0;
            var totalWithVat = 0;
            
            items.forEach(function(item) {
                totalWithoutVat += item.totalWithoutVat || 0;
                totalVatAmount += item.vatAmount || 0;
                totalWithVat += item.totalWithVat || 0;
            });
            
            return {
                totalWithoutVat: this.formatCurrency(totalWithoutVat),
                totalVatAmount: this.formatCurrency(totalVatAmount),
                totalWithVat: this.formatCurrency(totalWithVat)
            };
        },

        formatCurrency: function(value) {
            return parseFloat(value).toFixed(2);
        },

        addCustomItem: function() {
            // Add new custom item - user can type name or select from catalog
            this.items.push({
                productId: null,
                productName: '',
                quantity: 1,
                unitPrice: 0,
                vat: this.defaultVat,
                isCustom: true
            });
            this.model.set(this.name, this.items);
            this.reRender();
        },

        removeItem: function(index) {
            if (index >= 0 && index < this.items.length) {
                this.items.splice(index, 1);
                this.model.set(this.name, this.items);
                this.reRender();
            }
        },

        selectProduct: function(index) {
            this.notify('Loading...');
            
            this.createView('dialog', 'views/modals/select-records', {
                scope: 'ProductsItems',
                multiple: false,
                createButton: false,
                massSelect: false,
                primaryFilterName: null,
                boolFilterList: [],
                select: ['name', 'price', 'taxRate', 'sku', 'status'] // Explicitly fetch taxRate
            }, function(view) {
                view.render();
                
                this.listenToOnce(view, 'select', function(model) {
                    if (index >= 0 && index < this.items.length) {
                        // Fetch complete model data if needed
                        if (!model.has('taxRate')) {
                            this.getModelFactory().create('ProductsItems', function(productModel) {
                                productModel.id = model.id;
                                productModel.fetch().then(function() {
                                    this.items[index].productId = productModel.id;
                                    this.items[index].productName = productModel.get('name');
                                    this.items[index].unitPrice = parseFloat(productModel.get('price')) || 0;
                                    var taxRate = productModel.get('taxRate');
                                    this.items[index].vat = taxRate !== null && taxRate !== undefined ? parseFloat(taxRate) : this.defaultVat;
                                    this.items[index].isCustom = false; // Mark as catalog product
                                    
                                    this.model.set(this.name, this.items);
                                    this.reRender();
                                }.bind(this));
                            }.bind(this));
                        } else {
                            this.items[index].productId = model.id;
                            this.items[index].productName = model.get('name');
                            this.items[index].unitPrice = parseFloat(model.get('price')) || 0;
                            var taxRate = model.get('taxRate');
                            this.items[index].vat = taxRate !== null && taxRate !== undefined ? parseFloat(taxRate) : this.defaultVat;
                            this.items[index].isCustom = false; // Mark as catalog product
                            
                            this.model.set(this.name, this.items);
                            this.reRender();
                        }
                    }
                    view.close();
                }.bind(this));
            }.bind(this));
        },

        clearProduct: function(index) {
            if (index >= 0 && index < this.items.length) {
                this.items[index].productId = null;
                this.items[index].productName = '';
                this.items[index].unitPrice = 0;
                this.items[index].vat = this.defaultVat; // reset to default VAT
                this.items[index].isCustom = true;
                
                this.model.set(this.name, this.items);
                this.reRender();
            }
        },

        updateCalculations: function() {
            if (this.mode !== 'edit') return;
            
            var items = [];
            var totalWithoutVat = 0;
            var totalVatAmount = 0;
            var totalWithVat = 0;

            this.$el.find('.offer-item-row').each(function(index, row) {
                var $row = $(row);
                var productId = $row.find('[data-name="productId"]').val() || null;
                var productName = $row.find('[data-name="productName"]').val() || '';
                var quantity = parseFloat($row.find('[data-name="quantity"]').val()) || 1;
                var unitPrice = parseFloat($row.find('[data-name="unitPrice"]').val()) || 0;
                var vatValue = $row.find('[data-name="vat"]').val();
                var vat = vatValue !== '' && vatValue !== null && vatValue !== undefined ? parseFloat(vatValue) : this.defaultVat;
                
                var itemTotalWithoutVat = quantity * unitPrice;
                var itemVatAmount = itemTotalWithoutVat * (vat / 100);
                var itemTotalWithVat = itemTotalWithoutVat + itemVatAmount;

                // Update item totals in DOM
                $row.find('.item-total-without-vat').text(this.formatCurrency(itemTotalWithoutVat));
                $row.find('.item-total-with-vat').text(this.formatCurrency(itemTotalWithVat));
                
                items.push({
                    productId: productId,
                    productName: productName,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    vat: vat,
                    isCustom: !productId  // Save isCustom flag based on whether there's a productId
                });
                
                totalWithoutVat += itemTotalWithoutVat;
                totalVatAmount += itemVatAmount;
                totalWithVat += itemTotalWithVat;
            }.bind(this));

            // Update grand totals in DOM
            this.$el.find('.grand-total-without-vat').text(this.formatCurrency(totalWithoutVat));
            this.$el.find('.grand-total-vat').text(this.formatCurrency(totalVatAmount));
            this.$el.find('.grand-total-with-vat').text(this.formatCurrency(totalWithVat));
            
            this.items = items;
            this.model.set(this.name, items, {silent: true});
        },

        fetch: function() {
            if (this.mode !== 'edit') {
                return {};
            }

            var items = [];
            
            this.$el.find('.offer-item-row').each(function(index, row) {
                var $row = $(row);
                var productId = $row.find('[data-name="productId"]').val() || null;
                var productName = $row.find('[data-name="productName"]').val() || '';
                var quantity = parseFloat($row.find('[data-name="quantity"]').val()) || 1;
                var unitPrice = parseFloat($row.find('[data-name="unitPrice"]').val()) || 0;
                var vatValue = $row.find('[data-name="vat"]').val();
                var vat = vatValue !== '' && vatValue !== null && vatValue !== undefined ? parseFloat(vatValue) : this.defaultVat;
                
                if (productName.trim() !== '') {
                    items.push({
                        productId: productId,
                        productName: productName,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        vat: vat,
                        isCustom: !productId  // Save isCustom flag based on whether there's a productId
                    });
                }
            });

            var data = {};
            data[this.name] = items;
            return data;
        },

        validate: function() {
            if (this.mode !== 'edit') {
                return false;
            }
            
            var items = this.fetch()[this.name] || [];
            
            if (this.isRequired() && items.length === 0) {
                var msg = this.translate('fieldIsRequired', 'messages').replace('{field}', this.getLabelText());
                this.showValidationMessage(msg);
                return true;
            }

            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                
                if (!item.productName || item.productName.trim() === '') {
                    var msg = this.translate('Product name is required', 'messages') + ' (item ' + (i + 1) + ')';
                    this.showValidationMessage(msg);
                    return true;
                }
                
                if (item.quantity <= 0) {
                    var msg = this.translate('Quantity must be greater than 0', 'messages') + ' (item ' + (i + 1) + ')';
                    this.showValidationMessage(msg);
                    return true;
                }
            }

            return false;
        },

        showValidationMessage: function(message) {
            this.showMessage(message, 'error');
        }

    });

});