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
                this.reRender();
                return;
            }
            
            console.log('Loading fields for groupBy/orderBy entity:', targetEntity);
            
            // Load fields dynamically from the backend
            const basePath = window.location.pathname.replace(/\/+$/, '');
            const url = `${basePath}/api/v1/Report/action/getEntityFields`;
            
            $.ajax({
                url: url,
                type: 'GET',
                data: { entityType: targetEntity },
                dataType: 'json'
            }).done((fields) => {
                console.log('Received fields for groupBy/orderBy:', fields);
                
                // Filter fields that are suitable for grouping/ordering
                const suitableFields = fields.filter(field => this.isFieldSuitableForGrouping(field));
                const options = [''].concat(suitableFields.map(field => field.name));
                const translatedOptions = { '': this.translate('None') };
                
                suitableFields.forEach(field => {
                    translatedOptions[field.name] = field.label;
                });
                
                this.params.options = options;
                this.translatedOptions = translatedOptions;
                
                console.log('Updated groupBy/orderBy options:', options);
                
                this.reRender();
                
            }).fail((error) => {
                console.error('Error loading fields for groupBy/orderBy:', error);
                
                // Fallback to basic fields
                const basicFields = ['name', 'status', 'createdAt'];
                this.params.options = [''].concat(basicFields);
                this.translatedOptions = {
                    '': this.translate('None'),
                    'name': 'Name',
                    'status': 'Status',
                    'createdAt': 'Created At'
                };
                
                this.reRender();
            });
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