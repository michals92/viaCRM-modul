define('viacrm:views/invoice/invoice-dynamic-handler', [], function () {

    var Handler = function (recordView) {
        this.recordView = recordView;
        this.model = recordView.model;
    };

    _.extend(Handler.prototype, {

        init: function () {
            // Initialize dynamic handler for Invoice entity
            console.log('Invoice dynamic handler initialized');
        },

        onChange: function (model, options) {
            // Handle field changes
            if (options.ui && model.hasChanged('accountId')) {
                this.handleAccountChange(model, options);
            }
            
            // Calculate payment days when dates change
            if (options.ui && (model.hasChanged('issueDate') || model.hasChanged('dueDate'))) {
                this.calculatePaymentDays(model);
            }
        },

        handleAccountChange: function (model, options) {
            var accountId = model.get('accountId');
            var accountName = model.get('accountName');
            
            if (!accountId) {
                // Clear fields when account is removed
                this.clearAccountFields();
                return;
            }

            console.log('Account changed to:', accountName, accountId);
            
            // Fetch account data and populate invoice fields
            this.populateAccountFields(accountId);
        },

        populateAccountFields: function (accountId) {
            var self = this;
            
            // Use Espo.Ajax for the request - get all account fields to see what's available
            Espo.Ajax.getRequest('Account/' + accountId).then(function (account) {
                console.log('Account data received:', account);
                console.log('Available account fields:', Object.keys(account));
                
                // Set Company ID (IČO) - try different field names
                if (account.companyId) {
                    self.model.set('accountCompanyId', account.companyId);
                    console.log('Set companyId:', account.companyId);
                } else if (account.ico) {
                    self.model.set('accountCompanyId', account.ico);
                    console.log('Set ico:', account.ico);
                } else if (account.registrationNumber) {
                    self.model.set('accountCompanyId', account.registrationNumber);
                    console.log('Set registrationNumber:', account.registrationNumber);
                }
                
                // Set Tax ID (DIČ) - try different field names
                if (account.taxId) {
                    self.model.set('accountTaxId', account.taxId);
                    console.log('Set taxId:', account.taxId);
                } else if (account.dic) {
                    self.model.set('accountTaxId', account.dic);
                    console.log('Set dic:', account.dic);
                } else if (account.taxNumber) {
                    self.model.set('accountTaxId', account.taxNumber);
                    console.log('Set taxNumber:', account.taxNumber);
                }
                
                // Set VAT ID - try different field names
                if (account.vatId) {
                    self.model.set('accountVatId', account.vatId);
                    console.log('Set vatId:', account.vatId);
                } else if (account.vatNumber) {
                    self.model.set('accountVatId', account.vatNumber);
                    console.log('Set vatNumber:', account.vatNumber);
                }
                
                // Set billing address
                if (account.billingAddressStreet || account.billingAddressCity) {
                    self.model.set({
                        'billingAddressStreet': account.billingAddressStreet || '',
                        'billingAddressCity': account.billingAddressCity || '',
                        'billingAddressState': account.billingAddressState || '',
                        'billingAddressCountry': account.billingAddressCountry || '',
                        'billingAddressPostalCode': account.billingAddressPostalCode || ''
                    });
                }
                
                // Set shipping address (copy from billing if exists)
                if (account.shippingAddressStreet || account.shippingAddressCity) {
                    self.model.set({
                        'shippingAddressStreet': account.shippingAddressStreet || '',
                        'shippingAddressCity': account.shippingAddressCity || '',
                        'shippingAddressState': account.shippingAddressState || '',
                        'shippingAddressCountry': account.shippingAddressCountry || '',
                        'shippingAddressPostalCode': account.shippingAddressPostalCode || ''
                    });
                } else if (account.billingAddressStreet || account.billingAddressCity) {
                    // Copy billing to shipping if shipping is empty
                    self.model.set({
                        'shippingAddressStreet': account.billingAddressStreet || '',
                        'shippingAddressCity': account.billingAddressCity || '',
                        'shippingAddressState': account.billingAddressState || '',
                        'shippingAddressCountry': account.billingAddressCountry || '',
                        'shippingAddressPostalCode': account.billingAddressPostalCode || ''
                    });
                }
                
                // Set invoice email from account email
                if (account.emailAddress && !self.model.get('invoiceEmail')) {
                    self.model.set('invoiceEmail', account.emailAddress);
                }
                
            }).catch(function (error) {
                console.error('Error fetching account data:', error);
            });
        },

        clearAccountFields: function () {
            // Clear account-related fields when account is removed
            this.model.set({
                'accountCompanyId': '',
                'accountTaxId': '',
                'accountVatId': '',
                'billingAddressStreet': '',
                'billingAddressCity': '',
                'billingAddressState': '',
                'billingAddressCountry': '',
                'billingAddressPostalCode': '',
                'shippingAddressStreet': '',
                'shippingAddressCity': '',
                'shippingAddressState': '',
                'shippingAddressCountry': '',
                'shippingAddressPostalCode': '',
                'invoiceEmail': ''
            });
        },

        calculatePaymentDays: function (model) {
            var issueDate = model.get('issueDate');
            var dueDate = model.get('dueDate');
            
            if (!issueDate || !dueDate) {
                // Clear payment days if either date is missing
                model.set('paymentDays', null);
                return;
            }
            
            try {
                // Parse dates (format: YYYY-MM-DD)
                var issueDateObj = new Date(issueDate);
                var dueDateObj = new Date(dueDate);
                
                // Calculate difference in milliseconds
                var timeDiff = dueDateObj.getTime() - issueDateObj.getTime();
                
                // Convert to days
                var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                // Set the calculated days
                model.set('paymentDays', daysDiff);
                
                console.log('Payment days calculated:', daysDiff, 'from', issueDate, 'to', dueDate);
                
            } catch (error) {
                console.error('Error calculating payment days:', error);
                model.set('paymentDays', null);
            }
        }

    });

    return Handler;

});