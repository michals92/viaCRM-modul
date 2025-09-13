define('viacrm:views/fields/order-items', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        type: 'orderItems',

        listTemplate: 'viacrm:fields/order-items/list',
        detailTemplate: 'viacrm:fields/order-items/detail',
        editTemplate: 'viacrm:fields/order-items/edit',

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
            'click [data-action="toggleItemDiscountType"]': function(e) {
                this.toggleItemDiscountType(parseInt($(e.currentTarget).data('index')));
            },
            'click [data-action="toggleOverallDiscountType"]': function() {
                this.toggleOverallDiscountType();
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
            
            // Initialize discount settings
            this.overallDiscountType = this.model.get('overallDiscountType') || 'percentage';
            this.overallDiscountValue = this.model.get('overallDiscountValue') || 0;
        },

        data: function() {
            var data = Dep.prototype.data.call(this);
            
            this.items = this.model.get(this.name) || [];
            
            data.items = this.items.map(function(item) {
                var quantity = parseFloat(item.quantity) || 1;
                var unitPrice = parseFloat(item.unitPrice) || 0;
                var vat = item.vat !== null && item.vat !== undefined ? parseFloat(item.vat) : this.defaultVat;
                
                // Calculate item discount
                var discountType = item.discountType || 'percentage';
                var discountValue = parseFloat(item.discountValue) || 0;
                var subtotal = quantity * unitPrice;
                var discountAmount = 0;
                
                if (discountValue > 0) {
                    if (discountType === 'percentage') {
                        discountAmount = subtotal * (discountValue / 100);
                    } else {
                        discountAmount = discountValue;
                    }
                }
                
                var totalWithoutVat = subtotal - discountAmount;
                var vatAmount = totalWithoutVat * (vat / 100);
                var totalWithVat = totalWithoutVat + vatAmount;
                
                return {
                    productId: item.productId || null,
                    productName: item.productName || '',
                    quantity: quantity,
                    unitPrice: unitPrice,
                    vat: vat,
                    discountType: discountType,
                    discountValue: discountValue,
                    discountAmount: discountAmount,
                    subtotal: subtotal,
                    totalWithoutVat: totalWithoutVat,
                    vatAmount: vatAmount,
                    totalWithVat: totalWithVat,
                    isCustom: item.isCustom !== undefined ? item.isCustom : !item.productId,
                    isCatalogProduct: !!item.productId,
                    isDiscountPercent: discountType === 'percentage'
                };
            }.bind(this));
            
            var totals = this.calculateTotals(data.items);
            data.subtotalWithoutVat = totals.subtotalWithoutVat;
            data.itemDiscountAmount = totals.itemDiscountAmount;
            data.totalWithoutVatBeforeOverallDiscount = totals.totalWithoutVatBeforeOverallDiscount;
            data.overallDiscountAmount = totals.overallDiscountAmount;
            data.totalWithoutVat = totals.totalWithoutVat;
            data.totalVatAmount = totals.totalVatAmount;
            data.totalWithVat = totals.totalWithVat;
            data.overallDiscountType = this.overallDiscountType;
            data.overallDiscountValue = this.overallDiscountValue;
            data.isOverallDiscountPercent = this.overallDiscountType === 'percentage';
            
            return data;
        },

        calculateTotals: function(items) {
            var subtotalWithoutVat = 0;
            var itemDiscountAmount = 0;
            var totalWithoutVatBeforeOverallDiscount = 0;
            var totalVatAmount = 0;
            var totalWithVat = 0;
            
            items.forEach(function(item) {
                subtotalWithoutVat += item.subtotal || 0;
                itemDiscountAmount += item.discountAmount || 0;
                totalWithoutVatBeforeOverallDiscount += item.totalWithoutVat || 0;
                totalVatAmount += item.vatAmount || 0;
                totalWithVat += item.totalWithVat || 0;
            });
            
            // Calculate overall discount
            var overallDiscountAmount = 0;
            if (this.overallDiscountValue > 0) {
                if (this.overallDiscountType === 'percentage') {
                    overallDiscountAmount = totalWithoutVatBeforeOverallDiscount * (this.overallDiscountValue / 100);
                } else {
                    overallDiscountAmount = this.overallDiscountValue;
                }
            }
            
            // Apply overall discount before VAT
            var finalTotalWithoutVat = totalWithoutVatBeforeOverallDiscount - overallDiscountAmount;
            
            // Recalculate VAT based on final total without VAT
            var finalTotalVatAmount = 0;
            items.forEach(function(item) {
                if (totalWithoutVatBeforeOverallDiscount > 0) {
                    var itemRatio = (item.totalWithoutVat || 0) / totalWithoutVatBeforeOverallDiscount;
                    var itemFinalTotal = finalTotalWithoutVat * itemRatio;
                    finalTotalVatAmount += itemFinalTotal * (item.vat / 100);
                }
            });
            
            var finalTotalWithVat = finalTotalWithoutVat + finalTotalVatAmount;
            
            return {
                subtotalWithoutVat: this.formatCurrency(subtotalWithoutVat),
                itemDiscountAmount: this.formatCurrency(itemDiscountAmount),
                totalWithoutVatBeforeOverallDiscount: this.formatCurrency(totalWithoutVatBeforeOverallDiscount),
                overallDiscountAmount: this.formatCurrency(overallDiscountAmount),
                totalWithoutVat: this.formatCurrency(finalTotalWithoutVat),
                totalVatAmount: this.formatCurrency(finalTotalVatAmount),
                totalWithVat: this.formatCurrency(finalTotalWithVat)
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
                discountType: 'percentage',
                discountValue: 0,
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
                                    this.items[index].discountType = this.items[index].discountType || 'percentage';
                                    this.items[index].discountValue = this.items[index].discountValue || 0;
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
                            this.items[index].discountType = this.items[index].discountType || 'percentage';
                            this.items[index].discountValue = this.items[index].discountValue || 0;
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
                this.items[index].discountType = 'percentage';
                this.items[index].discountValue = 0;
                this.items[index].isCustom = true;
                
                this.model.set(this.name, this.items);
                this.reRender();
            }
        },

        updateCalculations: function() {
            if (this.mode !== 'edit') return;
            
            var items = [];
            var subtotalWithoutVat = 0;
            var itemDiscountAmount = 0;
            var totalWithoutVatBeforeOverallDiscount = 0;
            var totalVatAmount = 0;
            var totalWithVat = 0;
            
            // Get overall discount values
            this.overallDiscountValue = parseFloat(this.$el.find('[data-name="overallDiscountValue"]').val()) || 0;

            this.$el.find('.order-item-row').each(function(index, row) {
                var $row = $(row);
                var productId = $row.find('[data-name="productId"]').val() || null;
                var productName = $row.find('[data-name="productName"]').val() || '';
                var quantity = parseFloat($row.find('[data-name="quantity"]').val()) || 1;
                var unitPrice = parseFloat($row.find('[data-name="unitPrice"]').val()) || 0;
                var vatValue = $row.find('[data-name="vat"]').val();
                var vat = vatValue !== '' && vatValue !== null && vatValue !== undefined ? parseFloat(vatValue) : this.defaultVat;
                
                // Get item discount values
                var discountType = $row.find('[data-name="discountType"]').val() || 'percentage';
                var discountValue = parseFloat($row.find('[data-name="discountValue"]').val()) || 0;
                
                // Calculate item totals
                var itemSubtotal = quantity * unitPrice;
                var itemDiscountAmt = 0;
                
                if (discountValue > 0) {
                    if (discountType === 'percentage') {
                        itemDiscountAmt = itemSubtotal * (discountValue / 100);
                    } else {
                        itemDiscountAmt = discountValue;
                    }
                }
                
                var itemTotalWithoutVat = itemSubtotal - itemDiscountAmt;
                var itemVatAmount = itemTotalWithoutVat * (vat / 100);
                var itemTotalWithVat = itemTotalWithoutVat + itemVatAmount;

                // Update item totals in DOM
                $row.find('.item-subtotal').text(this.formatCurrency(itemSubtotal));
                if (itemDiscountAmt > 0) {
                    $row.find('.item-discount-amount').text('-' + this.formatCurrency(itemDiscountAmt));
                    $row.find('.discount-row').show();
                } else {
                    $row.find('.item-discount-amount').text('-0.00');
                    $row.find('.discount-row').hide();
                }
                $row.find('.item-total-without-vat').text(this.formatCurrency(itemTotalWithoutVat));
                $row.find('.item-total-with-vat').text(this.formatCurrency(itemTotalWithVat));
                
                items.push({
                    productId: productId,
                    productName: productName,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    vat: vat,
                    discountType: discountType,
                    discountValue: discountValue,
                    isCustom: !productId
                });
                
                subtotalWithoutVat += itemSubtotal;
                itemDiscountAmount += itemDiscountAmt;
                totalWithoutVatBeforeOverallDiscount += itemTotalWithoutVat;
                totalVatAmount += itemVatAmount;
                totalWithVat += itemTotalWithVat;
            }.bind(this));
            
            // Calculate overall discount
            var overallDiscountAmount = 0;
            if (this.overallDiscountValue > 0) {
                if (this.overallDiscountType === 'percentage') {
                    overallDiscountAmount = totalWithoutVatBeforeOverallDiscount * (this.overallDiscountValue / 100);
                } else {
                    overallDiscountAmount = this.overallDiscountValue;
                }
            }
            
            var finalTotalWithoutVat = totalWithoutVatBeforeOverallDiscount - overallDiscountAmount;
            
            // Recalculate VAT proportionally
            var finalTotalVatAmount = 0;
            if (totalWithoutVatBeforeOverallDiscount > 0) {
                var discountRatio = finalTotalWithoutVat / totalWithoutVatBeforeOverallDiscount;
                finalTotalVatAmount = totalVatAmount * discountRatio;
            }
            
            var finalTotalWithVat = finalTotalWithoutVat + finalTotalVatAmount;

            // Update grand totals in DOM
            this.$el.find('.subtotal-without-vat').text(this.formatCurrency(subtotalWithoutVat));
            this.$el.find('.item-discount-total').text(this.formatCurrency(itemDiscountAmount));
            this.$el.find('.total-before-overall-discount').text(this.formatCurrency(totalWithoutVatBeforeOverallDiscount));
            this.$el.find('.overall-discount-amount').text(this.formatCurrency(overallDiscountAmount));
            this.$el.find('.grand-total-without-vat').text(this.formatCurrency(finalTotalWithoutVat));
            this.$el.find('.grand-total-vat').text(this.formatCurrency(finalTotalVatAmount));
            this.$el.find('.grand-total-with-vat').text(this.formatCurrency(finalTotalWithVat));
            
            this.items = items;
            this.model.set(this.name, items, {silent: true});
            this.model.set('overallDiscountType', this.overallDiscountType, {silent: true});
            this.model.set('overallDiscountValue', this.overallDiscountValue, {silent: true});
        },

        fetch: function() {
            if (this.mode !== 'edit') {
                return {};
            }

            var items = [];
            
            this.$el.find('.order-item-row').each(function(index, row) {
                var $row = $(row);
                var productId = $row.find('[data-name="productId"]').val() || null;
                var productName = $row.find('[data-name="productName"]').val() || '';
                var quantity = parseFloat($row.find('[data-name="quantity"]').val()) || 1;
                var unitPrice = parseFloat($row.find('[data-name="unitPrice"]').val()) || 0;
                var vatValue = $row.find('[data-name="vat"]').val();
                var vat = vatValue !== '' && vatValue !== null && vatValue !== undefined ? parseFloat(vatValue) : this.defaultVat;
                var discountType = $row.find('[data-name="discountType"]').val() || 'percentage';
                var discountValue = parseFloat($row.find('[data-name="discountValue"]').val()) || 0;
                
                if (productName.trim() !== '') {
                    items.push({
                        productId: productId,
                        productName: productName,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        vat: vat,
                        discountType: discountType,
                        discountValue: discountValue,
                        isCustom: !productId
                    });
                }
            });
            
            // Get overall discount values
            this.overallDiscountValue = parseFloat(this.$el.find('[data-name="overallDiscountValue"]').val()) || 0;

            var data = {};
            data[this.name] = items;
            data['overallDiscountType'] = this.overallDiscountType;
            data['overallDiscountValue'] = this.overallDiscountValue;
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
        
        toggleItemDiscountType: function(index) {
            if (index >= 0 && index < this.items.length) {
                var currentType = this.items[index].discountType || 'percentage';
                this.items[index].discountType = currentType === 'percentage' ? 'fixed' : 'percentage';
                this.model.set(this.name, this.items);
                this.reRender();
            }
        },
        
        toggleOverallDiscountType: function() {
            this.overallDiscountType = this.overallDiscountType === 'percentage' ? 'fixed' : 'percentage';
            this.model.set('overallDiscountType', this.overallDiscountType);
            this.reRender();
        },

        showValidationMessage: function(message) {
            this.showMessage(message, 'error');
        }

    });

});