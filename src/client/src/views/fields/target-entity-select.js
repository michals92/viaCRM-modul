define('viacrm:views/fields/target-entity-select', ['views/fields/enum'], function (Dep) {

    return Dep.extend({

        setupOptions: function () {
            // Start with empty options
            this.params.options = [''];
            this.translatedOptions = {'': ''};
            
            // Load available entities dynamically
            this.loadAvailableEntities();
        },

        loadAvailableEntities: function () {
            console.log('Loading available entities...');
            
            $.ajax({
                url: 'Report/action/getAvailableEntities',
                type: 'GET',
                dataType: 'json'
            }).done((entities) => {
                console.log('Received entities:', entities);
                
                // Update options
                this.params.options = [''].concat(entities.map(entity => entity.name));
                
                // Update translated options
                this.translatedOptions = {'': ''};
                entities.forEach(entity => {
                    this.translatedOptions[entity.name] = entity.label;
                });
                
                console.log('Updated options:', this.params.options);
                console.log('Updated translations:', this.translatedOptions);
                
                // Re-render the field if already rendered
                if (this.isRendered()) {
                    this.reRender();
                }
                
            }).fail((error) => {
                console.error('Error loading entities:', error);
                
                // Fallback to some basic entities
                const fallbackEntities = [
                    'Account', 'Contact', 'Lead', 'Opportunity', 'Case', 'Task', 
                    'Call', 'Meeting', 'Email', 'Document', 'Campaign'
                ];
                
                this.params.options = [''].concat(fallbackEntities);
                this.translatedOptions = {'': ''};
                fallbackEntities.forEach(entity => {
                    this.translatedOptions[entity] = entity;
                });
                
                if (this.isRendered()) {
                    this.reRender();
                }
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            // Set up change listener to trigger field loading for related fields
            this.$element.on('change', () => {
                const selectedEntity = this.fetch().targetEntity;
                console.log('Target entity changed to:', selectedEntity);
                
                // Trigger event so other fields can react
                this.trigger('change');
            });
        }
    });
});