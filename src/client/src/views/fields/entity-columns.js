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
            
            // For editing existing records, update fields once after first render
            if (this.model.get('targetEntity')) {
                this.once('after:render', () => {
                    this.updateFieldOptions();
                });
            }
        },

        updateFieldOptions: function () {
            const targetEntity = this.model.get('targetEntity');
            
            if (!targetEntity) {
                this.params.options = [];
                this.translatedOptions = {};
                this.reRender();
                return;
            }
            
            
            // Load fields dynamically from the backend
            const basePath = window.location.pathname.replace(/\/+$/, '');
            const url = `${basePath}/api/v1/Report/action/getEntityFields`;
            
            $.ajax({
                url: url,
                type: 'GET',
                data: { entityType: targetEntity },
                dataType: 'json'
            }).done((fields) => {                
                const options = fields.map(field => field.name);
                const translatedOptions = {};
                
                fields.forEach(field => {
                    translatedOptions[field.name] = field.label;
                });
                
                this.params.options = options;
                this.translatedOptions = translatedOptions;
                
                // Re-render only if already rendered
                if (this.isRendered()) {
                    this.reRender();
                }
                
            }).fail((error) => {
                console.error('Error loading fields for', targetEntity, ':', error);
                
                // Fallback to basic fields
                const basicFields = ['id', 'name', 'status', 'createdAt', 'modifiedAt'];
                this.params.options = basicFields;
                this.translatedOptions = {
                    'id': 'ID',
                    'name': 'Name',
                    'status': 'Status',
                    'createdAt': 'Created At',
                    'modifiedAt': 'Modified At'
                };
                
                // Re-render only if already rendered
                if (this.isRendered()) {
                    this.reRender();
                }
            });
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