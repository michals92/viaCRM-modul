define('viacrm:views/fields/entity-field-select', ['views/fields/enum'], function (Dep) {

    return Dep.extend({

        type: 'entityFieldSelect',

        setup: function () {
            // Set default options
            this.params.options = ['', 'name', 'status', 'createdAt'];
            this.translatedOptions = {
                '': this.translate('None'),
                'name': 'Name',
                'status': 'Status',
                'createdAt': 'Created At'
            };
            
            Dep.prototype.setup.call(this);
            
            this.listenTo(this.model, 'change:targetEntity', () => {
                this.updateFieldOptions();
            });
        },

        updateFieldOptions: function () {
            const targetEntity = this.model.get('targetEntity');
            
            if (!targetEntity) {
                this.params.options = [''];
                this.translatedOptions = { '': this.translate('None') };
            } else {
                // Static field options for each entity type
                const entityFields = {
                    'Absence': ['name', 'status', 'startDate', 'endDate', 'type', 'createdAt'],
                    'Attendance': ['name', 'date', 'checkIn', 'checkOut', 'status'],
                    'Hr': ['name', 'department', 'position', 'status'],
                    'Order': ['name', 'number', 'status', 'amount', 'dateOrdered'],
                    'Offer': ['name', 'number', 'status', 'amount', 'validUntil'],
                    'ProductsItems': ['name', 'sku', 'price', 'quantity', 'status'],
                    'User': ['userName', 'firstName', 'lastName', 'emailAddress', 'isActive'],
                    'Account': ['name', 'type', 'industry', 'website', 'emailAddress'],
                    'Contact': ['name', 'emailAddress', 'phoneNumber', 'title', 'accountName']
                };
    
                const allFields = entityFields[targetEntity] || [];
                const options = [''].concat(allFields);
                const translatedOptions = { '': this.translate('None') };
                
                allFields.forEach(field => {
                    translatedOptions[field] = this.translate(field, 'fields', targetEntity) || field;
                });
    
                this.params.options = options;
                this.translatedOptions = translatedOptions;
            }
            
            this.reRender();
        },

        isFieldSuitableForGrouping: function (field) {
            // Only include fields that make sense for grouping/ordering
            const suitableTypes = [
                'varchar', 'enum', 'bool', 'date', 'datetime', 
                'int', 'float', 'currency', 'link'
            ];
            return suitableTypes.includes(field.type);
        },

        getTranslatedOptions: function () {
            return this.translatedOptions || { '': this.translate('None') };
        }
    });
});