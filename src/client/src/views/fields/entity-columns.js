define('viacrm:views/fields/entity-columns', ['views/fields/multi-enum'], function (Dep) {

    return Dep.extend({

        type: 'entityColumns',

        setup: function () {
            // Set default options
            this.params.options = ['name', 'status', 'createdAt'];
            this.translatedOptions = {
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
                this.params.options = [];
                this.translatedOptions = {};
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
    
                const options = entityFields[targetEntity] || [];
                const translatedOptions = {};
                
                options.forEach(field => {
                    translatedOptions[field] = this.translate(field, 'fields', targetEntity) || field;
                });
    
                this.params.options = options;
                this.translatedOptions = translatedOptions;
            }
            
            this.reRender();
        },

        getTranslatedOptions: function () {
            return this.translatedOptions || {};
        },

        fetch: function () {
            const data = Dep.prototype.fetch.call(this);
            // Convert array to proper format expected by the backend
            if (data[this.name] && Array.isArray(data[this.name])) {
                // Keep as array for jsonArray field type
                return data;
            }
            return data;
        }
    });
});