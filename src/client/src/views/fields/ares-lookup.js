define('viacrm:views/fields/ares-lookup', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        type: 'aresLookup',

        listTemplate: 'viacrm:fields/ares-lookup/list',
        detailTemplate: 'viacrm:fields/ares-lookup/detail',
        editTemplate: 'viacrm:fields/ares-lookup/edit',

        events: {
            'click [data-action="searchByIco"]': function() {
                this.searchByIco();
            },
            'click [data-action="clearCompany"]': function() {
                this.clearCompany();
            },
            'input [data-name="icoInput"]': function(e) {
                this.onIcoInput(e);
            },
            'input [data-name="nameInput"]': function(e) {
                this.onNameInput(e);
            },
            'click .company-suggestion': function(e) {
                this.selectCompany(e);
            }
        },

        data: function() {
            var data = Dep.prototype.data.call(this);
            
            var value = this.model.get(this.name);
            data.companyData = value ? JSON.parse(value) : null;
            data.autoFillFields = this.params.autoFillFields || [];
            
            return data;
        },

        setup: function() {
            Dep.prototype.setup.call(this);
            
            this.autoFillFields = this.params.autoFillFields || [];
            this.searchTimeout = null;
            this.suggestions = [];
        },

        onIcoInput: function(e) {
            var ico = e.target.value.trim();
            
            // Auto search when ICO has 8 digits
            if (ico.length === 8 && /^\d+$/.test(ico)) {
                this.performSearchByIco(ico);
            }
        },

        onNameInput: function(e) {
            var name = e.target.value.trim();
            
            clearTimeout(this.searchTimeout);
            
            if (name.length < 3) {
                this.hideSuggestions();
                return;
            }

            this.searchTimeout = setTimeout(() => {
                this.performSearchByName(name);
            }, 500);
        },

        searchByIco: function() {
            var ico = this.$el.find('[data-name="icoInput"]').val().trim();
            
            if (!ico) {
                this.notify('Zadejte IČO', 'warning');
                return;
            }

            this.performSearchByIco(ico);
        },

        performSearchByIco: function(ico) {
            if (!ico || ico.length < 6) {
                return;
            }

            this.notify('Vyhledávám v ARES...');

            Espo.Ajax.getRequest('AresLookup/searchByIco', {
                ico: ico
            }).then(response => {
                this.notify(false);
                
                if (response.company) {
                    this.fillCompanyData(response.company);
                    this.hideSuggestions();
                } else {
                    this.notify('Firma s IČO ' + ico + ' nebyla nalezena', 'warning');
                }
            }).catch(error => {
                this.notify('Chyba při vyhledávání v ARES', 'error');
                console.error('ARES search error:', error);
            });
        },

        performSearchByName: function(name) {
            if (!name || name.length < 3) {
                return;
            }

            this.notify('Vyhledávám...');

            Espo.Ajax.getRequest('AresLookup/searchByName', {
                name: name
            }).then(response => {
                this.notify(false);
                this.suggestions = response.companies || [];
                this.showSuggestions();
            }).catch(error => {
                this.notify('Chyba při vyhledávání', 'error');
                console.error('Name search error:', error);
            });
        },

        showSuggestions: function() {
            if (this.suggestions.length === 0) {
                this.hideSuggestions();
                return;
            }

            var $suggestions = this.$el.find('.company-suggestions');
            $suggestions.empty();

            this.suggestions.forEach((company, index) => {
                var $item = $('<div>')
                    .addClass('company-suggestion')
                    .attr('data-index', index)
                    .html(`
                        <div class="company-name">${company.name}</div>
                        <div class="company-details">
                            IČO: ${company.ico || 'N/A'}
                            ${company.address ? ' | ' + company.address : ''}
                            ${company.city ? ', ' + company.city : ''}
                        </div>
                    `);
                
                $suggestions.append($item);
            });

            $suggestions.show();
        },

        hideSuggestions: function() {
            this.$el.find('.company-suggestions').hide();
        },

        selectCompany: function(e) {
            var index = parseInt($(e.currentTarget).data('index'));
            var company = this.suggestions[index];
            
            if (!company) return;

            // Get full details for selected company
            this.performSearchByIco(company.ico);
        },

        fillCompanyData: function(companyData) {
            this.model.set(this.name, JSON.stringify(companyData));
            
            if (this.autoFillFields && this.autoFillFields.length > 0) {
                this.autoFillEntityFields(companyData);
            }
            
            this.reRender();
            this.trigger('change');
        },

        autoFillEntityFields: function(companyData) {
            this.autoFillFields.forEach(fieldName => {
                switch (fieldName) {
                    case 'name':
                        if (companyData.name && !this.model.get('name')) {
                            this.model.set('name', companyData.name);
                        }
                        break;
                    
                    case 'billingAddress':
                        if (companyData.address || companyData.city || companyData.zip) {
                            this.model.set('billingAddressStreet', companyData.address || '');
                            this.model.set('billingAddressCity', companyData.city || '');
                            this.model.set('billingAddressPostalCode', companyData.zip || '');
                            this.model.set('billingAddressCountry', 'Česká republika');
                        }
                        break;
                    
                    case 'shippingAddress':
                        if (companyData.address || companyData.city || companyData.zip) {
                            this.model.set('shippingAddressStreet', companyData.address || '');
                            this.model.set('shippingAddressCity', companyData.city || '');
                            this.model.set('shippingAddressPostalCode', companyData.zip || '');
                            this.model.set('shippingAddressCountry', 'Česká republika');
                        }
                        break;
                }
            });
        },

        clearCompany: function() {
            this.model.set(this.name, null);
            this.$el.find('[data-name="icoInput"]').val('');
            this.$el.find('[data-name="nameInput"]').val('');
            this.hideSuggestions();
            this.reRender();
            this.trigger('change');
        },

        fetch: function() {
            var data = {};
            data[this.name] = this.model.get(this.name);
            return data;
        },

        validate: function() {
            if (this.isRequired() && !this.model.get(this.name)) {
                var msg = this.translate('fieldIsRequired', 'messages').replace('{field}', this.getLabelText());
                this.showValidationMessage(msg);
                return true;
            }
            return false;
        },

        showValidationMessage: function(message) {
            this.showMessage(message, 'error');
        }

    });

});