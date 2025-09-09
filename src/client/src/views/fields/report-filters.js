define('viacrm:views/fields/report-filters', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        type: 'reportFilters',

        editTemplate: 'viacrm:fields/report-filters/edit',
        detailTemplate: 'viacrm:fields/report-filters/detail',

        data: function () {
            var data = Dep.prototype.data.call(this);
            data.valueIsSet = this.model.has(this.name);
            data.isNotEmpty = !!this.model.get(this.name);
            data.filters = this.getFiltersForDisplay();
            return data;
        },

        setup: function () {
            Dep.prototype.setup.call(this);
            this.entityFields = [];
            
            this.listenTo(this.model, 'change:targetEntity', () => {
                this._fieldsLoaded = false;
                this.loadEntityFields();
                if (this.mode === 'edit') {
                    this.reRender();
                }
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            if (this.mode === 'edit') {
                this.initEdit();
                if (this.model.get('targetEntity') && !this._fieldsLoaded) {
                    this.loadEntityFields();
                }
            }
        },

        initEdit: function () {
            this.$el.find('.add-filter-btn').on('click', () => {
                this.addFilter();
            });
            
            this.$el.find('.filter-row').each((index, element) => {
                this.initFilterRow($(element), index);
            });
        },

        loadEntityFields: function () {
            const targetEntity = this.model.get('targetEntity');
            if (!targetEntity) {
                this.entityFields = [];
                this._fieldsLoaded = false;
                this.updateFieldOptions();
                return;
            }

            // Static field options for each entity type
            const entityFieldData = {
                'Absence': [
                    {name: 'name', type: 'varchar', label: 'Name'},
                    {name: 'status', type: 'enum', label: 'Status'},
                    {name: 'startDate', type: 'date', label: 'Start Date'},
                    {name: 'endDate', type: 'date', label: 'End Date'},
                    {name: 'type', type: 'enum', label: 'Type'},
                    {name: 'createdAt', type: 'datetime', label: 'Created At'}
                ],
                'Attendance': [
                    {name: 'name', type: 'varchar', label: 'Name'},
                    {name: 'date', type: 'date', label: 'Date'},
                    {name: 'checkIn', type: 'datetime', label: 'Check In'},
                    {name: 'checkOut', type: 'datetime', label: 'Check Out'},
                    {name: 'status', type: 'enum', label: 'Status'}
                ],
                'Hr': [
                    {name: 'name', type: 'varchar', label: 'Name'},
                    {name: 'department', type: 'varchar', label: 'Department'},
                    {name: 'position', type: 'varchar', label: 'Position'},
                    {name: 'status', type: 'enum', label: 'Status'}
                ],
                'Order': [
                    {name: 'name', type: 'varchar', label: 'Name'},
                    {name: 'number', type: 'varchar', label: 'Number'},
                    {name: 'status', type: 'enum', label: 'Status'},
                    {name: 'amount', type: 'currency', label: 'Amount'},
                    {name: 'dateOrdered', type: 'date', label: 'Date Ordered'}
                ],
                'Offer': [
                    {name: 'name', type: 'varchar', label: 'Name'},
                    {name: 'number', type: 'varchar', label: 'Number'},
                    {name: 'status', type: 'enum', label: 'Status'},
                    {name: 'amount', type: 'currency', label: 'Amount'},
                    {name: 'validUntil', type: 'date', label: 'Valid Until'}
                ],
                'ProductsItems': [
                    {name: 'name', type: 'varchar', label: 'Name'},
                    {name: 'sku', type: 'varchar', label: 'SKU'},
                    {name: 'price', type: 'currency', label: 'Price'},
                    {name: 'quantity', type: 'int', label: 'Quantity'},
                    {name: 'status', type: 'enum', label: 'Status'}
                ],
                'User': [
                    {name: 'userName', type: 'varchar', label: 'User Name'},
                    {name: 'firstName', type: 'varchar', label: 'First Name'},
                    {name: 'lastName', type: 'varchar', label: 'Last Name'},
                    {name: 'emailAddress', type: 'email', label: 'Email Address'},
                    {name: 'isActive', type: 'bool', label: 'Is Active'}
                ],
                'Account': [
                    {name: 'name', type: 'varchar', label: 'Name'},
                    {name: 'type', type: 'enum', label: 'Type'},
                    {name: 'industry', type: 'enum', label: 'Industry'},
                    {name: 'website', type: 'url', label: 'Website'},
                    {name: 'emailAddress', type: 'email', label: 'Email Address'}
                ],
                'Contact': [
                    {name: 'name', type: 'personName', label: 'Name'},
                    {name: 'emailAddress', type: 'email', label: 'Email Address'},
                    {name: 'phoneNumber', type: 'phone', label: 'Phone Number'},
                    {name: 'title', type: 'varchar', label: 'Title'},
                    {name: 'accountName', type: 'varchar', label: 'Account'}
                ]
            };

            this.entityFields = entityFieldData[targetEntity] || [];
            this._fieldsLoaded = true;
            this.updateFieldOptions();
        },

        updateFieldOptions: function () {
            this.$el.find('.filter-field-select').each((index, element) => {
                const $select = $(element);
                $select.empty();
                $select.append('<option value="">Select Field</option>');
                
                this.entityFields.forEach(field => {
                    $select.append(`<option value="${field.name}">${field.label}</option>`);
                });
            });
        },

        addFilter: function () {
            const filtersContainer = this.$el.find('.filters-container');
            const filterIndex = filtersContainer.find('.filter-row').length;
            
            const filterHtml = `
                <div class="filter-row" style="margin-bottom: 10px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                    <div class="row">
                        <div class="col-md-3">
                            <select class="form-control filter-field-select" data-index="${filterIndex}">
                                <option value="">Select Field</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-control filter-type-select" data-index="${filterIndex}">
                                <option value="">Select Condition</option>
                                <option value="equals">Equals</option>
                                <option value="notEquals">Not Equals</option>
                                <option value="contains">Contains</option>
                                <option value="greaterThan">Greater Than</option>
                                <option value="lessThan">Less Than</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <input type="text" class="form-control filter-value-input" placeholder="Value" data-index="${filterIndex}">
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-danger btn-sm remove-filter-btn">
                                <span class="fas fa-trash"></span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            filtersContainer.append(filterHtml);
            this.initFilterRow(filtersContainer.find('.filter-row').last(), filterIndex);
            this.updateFieldOptions();
        },

        initFilterRow: function ($row, index) {
            $row.find('.remove-filter-btn').on('click', () => {
                $row.remove();
                this.trigger('change');
            });
            
            $row.find('select, input').on('change', () => {
                this.trigger('change');
            });
        },

        getFiltersForDisplay: function () {
            const filters = this.model.get(this.name) || {};
            const display = [];
            
            Object.keys(filters).forEach(field => {
                const filter = filters[field];
                display.push({
                    field: field,
                    type: filter.type,
                    value: filter.value
                });
            });
            
            return display;
        },

        fetch: function () {
            if (this.mode !== 'edit') {
                return {};
            }
            
            const filters = {};
            
            this.$el.find('.filter-row').each((index, element) => {
                const $row = $(element);
                const field = $row.find('.filter-field-select').val();
                const type = $row.find('.filter-type-select').val();
                const value = $row.find('.filter-value-input').val();
                
                if (field && type && value) {
                    filters[field] = {
                        type: type,
                        value: value
                    };
                }
            });
            
            const data = {};
            data[this.name] = filters;
            return data;
        },

        validateRequired: function () {
            // Not required by default
            return false;
        }
    });
});