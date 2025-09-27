define('viacrm:views/modals/simple-filters', ['views/modal'], function (Dep) {

    return Dep.extend({

        className: 'dialog dialog-record',

        backdrop: true,
        
        templateContent: '<div class="modal-body-content"></div>',

        buttonList: [
            {
                name: 'apply',
                label: 'Apply',
                style: 'primary'
            },
            {
                name: 'reset',
                label: 'Reset'
            },
            {
                name: 'cancel',
                label: 'Cancel'
            }
        ],

        setup: function () {
            this.scope = this.options.scope || this.options.entityType;
            this.searchData = this.options.searchData || {};
            
            this.header = this.translate('Select Filters') + ' - ' + this.translate(this.scope, 'scopeNames');
            
            // Get available filters
            const rawFilterList = this.getMetadata().get(['clientDefs', this.scope, 'filterList']) || [];
            const rawBoolFilterList = this.getMetadata().get(['clientDefs', this.scope, 'boolFilterList']) || [];
            
            // Convert to simple arrays (handle both string and object formats)
            this.primaryFilters = [];
            rawFilterList.forEach(filter => {
                if (typeof filter === 'string') {
                    this.primaryFilters.push(filter);
                } else if (typeof filter === 'object' && filter.name) {
                    this.primaryFilters.push(filter.name);
                }
            });
            
            this.boolFilters = [];
            rawBoolFilterList.forEach(filter => {
                if (typeof filter === 'string') {
                    this.boolFilters.push(filter);
                } else if (typeof filter === 'object' && filter.name) {
                    this.boolFilters.push(filter.name);
                }
            });
            
            // Get entity fields for field filters
            const entityDefs = this.getMetadata().get(['entityDefs', this.scope]) || {};
            this.fieldFilters = [];
            
            if (entityDefs.fields) {
                const allowedTypes = ['varchar', 'text', 'enum', 'link', 'date', 'datetime', 'int', 'float', 'currency', 'phone', 'email'];
                const excludeFields = ['id', 'deleted', 'createdAt', 'modifiedAt', 'createdBy', 'modifiedBy'];
                
                Object.keys(entityDefs.fields).forEach(fieldName => {
                    const field = entityDefs.fields[fieldName];
                    
                    if (!excludeFields.includes(fieldName) && 
                        allowedTypes.includes(field.type) && 
                        !field.notStorable && 
                        !field.disabled) {
                        
                        const fieldData = {
                            name: fieldName,
                            type: field.type,
                            label: this.translate(fieldName, 'fields', this.scope),
                            options: field.options || []
                        };
                        
                        // Add foreign entity for link fields
                        if (field.type === 'link' && field.entity) {
                            fieldData.entity = field.entity;
                        }
                        
                        this.fieldFilters.push(fieldData);
                    }
                });
                
                // Sort by label and limit to fewer fields
                this.fieldFilters.sort((a, b) => a.label.localeCompare(b.label));
                this.fieldFilters = this.fieldFilters.slice(0, 12); // Limit to 12 fields
            }
            
            // Initialize selected values
            this.selectedPrimary = this.searchData.primary || '';
            this.selectedBools = this.searchData.bool || {};
            this.selectedFields = {};
            
            // Parse where conditions to field values
            if (this.searchData.where && Array.isArray(this.searchData.where)) {
                this.searchData.where.forEach(condition => {
                    if (condition.field && condition.value !== undefined) {
                        // Handle link fields that end with 'Id'
                        if (condition.field.endsWith('Id')) {
                            const fieldName = condition.field.replace(/Id$/, '');
                            this.selectedFields[fieldName + 'Id'] = condition.value;
                            // We don't have the name stored, will be empty
                            this.selectedFields[fieldName + 'Name'] = '';
                        } else {
                            this.selectedFields[condition.field] = condition.value;
                        }
                    }
                });
            }
        },

        events: {
            'click .select-link': function(e) {
                const fieldName = $(e.currentTarget).data('field');
                const fieldIndex = $(e.currentTarget).data('index');
                this.selectLinkField(fieldName, fieldIndex);
            },
            'click .clear-link': function(e) {
                const fieldName = $(e.currentTarget).data('field');
                this.clearLinkField(fieldName);
            }
        },
        
        data: function () {
            return {
                header: this.header,
                buttonList: this.buttonList
            };
        },
        
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            let html = '<div class="container-fluid" style="padding: 0;">';
            
            // Primary filter dropdown
            if (this.primaryFilters.length > 0) {
                html += '<div class="form-group">';
                html += '<label>' + this.translate('Primary Filter', 'labels') + '</label>';
                html += '<select class="form-control" name="primaryFilter">';
                html += '<option value="">--' + this.translate('None', 'labels') + '--</option>';
                
                this.primaryFilters.forEach(filter => {
                    const selected = filter === this.selectedPrimary ? 'selected' : '';
                    const label = this.translate(filter, 'presetFilters', this.scope);
                    html += '<option value="' + filter + '" ' + selected + '>' + label + '</option>';
                });
                
                html += '</select>';
                html += '</div>';
            }
            
            // Bool filters checkboxes
            if (this.boolFilters.length > 0) {
                html += '<div class="form-group">';
                html += '<label>' + this.translate('Quick Filters', 'labels') + '</label>';
                html += '<div class="row">';
                
                this.boolFilters.forEach((filter, index) => {
                    if (index % 3 === 0 && index > 0) {
                        html += '</div><div class="row">';
                    }
                    
                    const checked = this.selectedBools[filter] ? 'checked' : '';
                    const label = this.translate(filter, 'boolFilters', this.scope);
                    
                    html += '<div class="col-sm-4">';
                    html += '<div class="checkbox">';
                    html += '<label>';
                    html += '<input type="checkbox" name="bool_' + filter + '" value="1" ' + checked + '> ';
                    html += label;
                    html += '</label>';
                    html += '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            // Field filters
            if (this.fieldFilters.length > 0) {
                html += '<div class="form-group">';
                html += '<label>' + this.translate('Field Filters', 'labels') + '</label>';
                html += '<div class="field-filters-container" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">';
                
                this.fieldFilters.forEach((field, index) => {
                    const value = this.selectedFields[field.name] || '';
                    const valueId = this.selectedFields[field.name + 'Id'] || '';
                    const valueName = this.selectedFields[field.name + 'Name'] || '';
                    
                    html += '<div class="form-group" style="margin-bottom: 15px;">';
                    html += '<label class="control-label">' + field.label + '</label>';
                    
                    if (field.type === 'enum' && field.options.length > 0) {
                        // Dropdown for enum fields
                        html += '<select class="form-control" name="field_' + field.name + '">';
                        html += '<option value="">--</option>';
                        field.options.forEach(option => {
                            const selected = option === value ? 'selected' : '';
                            const optionLabel = this.translate(option, 'options', this.scope + '.' + field.name) || option;
                            html += '<option value="' + option + '" ' + selected + '>' + optionLabel + '</option>';
                        });
                        html += '</select>';
                    } else if (field.type === 'link') {
                        // Link field with select button
                        html += '<div class="input-group">';
                        html += '<input type="text" class="form-control" name="field_' + field.name + '_name" value="' + valueName + '" placeholder="' + this.translate('Select', 'labels') + '" readonly style="background-color: #fff;">';
                        html += '<input type="hidden" name="field_' + field.name + '" value="' + valueId + '">';
                        html += '<span class="input-group-btn">';
                        html += '<button type="button" class="btn btn-default select-link" data-field="' + field.name + '" data-index="' + index + '" title="' + this.translate('Select', 'labels') + '">';
                        html += '<span class="fas fa-search"></span>';
                        html += '</button>';
                        html += '<button type="button" class="btn btn-default clear-link" data-field="' + field.name + '" title="' + this.translate('Clear', 'labels') + '">';
                        html += '<span class="fas fa-times"></span>';
                        html += '</button>';
                        html += '</span>';
                        html += '</div>';
                    } else {
                        // Text input for other fields
                        const placeholder = field.type === 'date' ? 'YYYY-MM-DD' : 
                                          field.type === 'datetime' ? 'YYYY-MM-DD HH:MM' : '';
                        html += '<input type="text" class="form-control" name="field_' + field.name + '" value="' + value + '" placeholder="' + placeholder + '">';
                    }
                    
                    html += '</div>';
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            html += '</div>'; // Close container-fluid
            
            this.$el.find('.modal-body-content').html(html);
        },

        actionApply: function () {
            const searchData = {};
            
            // Get primary filter
            const primaryFilter = this.$el.find('select[name="primaryFilter"]').val();
            if (primaryFilter) {
                searchData.primary = primaryFilter;
            }
            
            // Get bool filters
            const boolData = {};
            this.boolFilters.forEach(filter => {
                const checked = this.$el.find('input[name="bool_' + filter + '"]').is(':checked');
                if (checked) {
                    boolData[filter] = true;
                }
            });
            
            if (Object.keys(boolData).length > 0) {
                searchData.bool = boolData;
            }
            
            // Get field filters
            const whereConditions = [];
            this.fieldFilters.forEach(field => {
                if (field.type === 'link') {
                    const valueId = this.$el.find('[name="field_' + field.name + '"]').val();
                    if (valueId) {
                        whereConditions.push({
                            type: 'equals',
                            field: field.name + 'Id',
                            value: valueId
                        });
                    }
                } else {
                    const value = this.$el.find('[name="field_' + field.name + '"]').val();
                    if (value) {
                        let type = 'equals';
                        
                        // Determine filter type based on field type
                        if (field.type === 'varchar' || field.type === 'text') {
                            type = 'contains';
                        } else if (field.type === 'enum') {
                            type = 'equals';
                        } else if (field.type === 'date' || field.type === 'datetime') {
                            type = 'on';
                        }
                        
                        whereConditions.push({
                            type: type,
                            field: field.name,
                            value: value
                        });
                    }
                }
            });
            
            if (whereConditions.length > 0) {
                searchData.where = whereConditions;
            }
            
            this.trigger('apply', searchData);
            this.close();
        },

        actionReset: function () {
            this.$el.find('select[name="primaryFilter"]').val('');
            this.$el.find('input[type="checkbox"]').prop('checked', false);
            this.$el.find('input[name^="field_"]').val('');
            this.$el.find('select[name^="field_"]').val('');
        },

        actionCancel: function () {
            this.close();
        },
        
        selectLinkField: function(fieldName, fieldIndex) {
            const field = this.fieldFilters[fieldIndex];
            if (!field) return;
            
            // Get foreign entity type
            let foreignEntity = field.entity;
            if (!foreignEntity) {
                const entityDefs = this.getMetadata().get(['entityDefs', this.scope, 'fields', fieldName]) || {};
                foreignEntity = entityDefs.entity || entityDefs.entityList;
                
                // Try to guess entity from field name
                if (!foreignEntity) {
                    if (fieldName === 'assignedUser') {
                        foreignEntity = 'User';
                    } else if (fieldName === 'teams') {
                        foreignEntity = 'Team';
                    } else if (fieldName === 'account') {
                        foreignEntity = 'Account';
                    } else if (fieldName === 'contact') {
                        foreignEntity = 'Contact';
                    } else {
                        // Capitalize first letter as fallback
                        foreignEntity = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                    }
                }
            }
            
            // Open select modal
            this.createView('selectModal', 'views/modals/select-records', {
                scope: foreignEntity,
                multiple: false
            }, (view) => {
                view.render();
                
                this.listenToOnce(view, 'select', (model) => {
                    const id = model.id || model.get('id');
                    const name = model.get('name') || model.get('id');
                    
                    // Update fields
                    this.$el.find('[name="field_' + fieldName + '"]').val(id);
                    this.$el.find('[name="field_' + fieldName + '_name"]').val(name);
                    
                    // Store for later use
                    this.selectedFields[fieldName + 'Id'] = id;
                    this.selectedFields[fieldName + 'Name'] = name;
                });
            });
        },
        
        clearLinkField: function(fieldName) {
            this.$el.find('[name="field_' + fieldName + '"]').val('');
            this.$el.find('[name="field_' + fieldName + '_name"]').val('');
            delete this.selectedFields[fieldName + 'Id'];
            delete this.selectedFields[fieldName + 'Name'];
        }
    });
});