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
            
            // Use proper EspoCRM API endpoint format
            const basePath = window.location.pathname.replace(/\/+$/, '');
            const url = `${basePath}/api/v1/Report/action/getAvailableEntities`;
            
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json'
            }).done((entities) => {                
                // Update options
                this.params.options = [''].concat(entities.map(entity => entity.name));
                
                // Update translated options
                this.translatedOptions = {'': ''};
                entities.forEach(entity => {
                    this.translatedOptions[entity.name] = entity.label;
                });
                
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
            // Use $el instead of $element for EspoCRM compatibility
            if (this.$el && this.$el.find('select').length > 0) {
                this.$el.find('select').on('change', () => {
                    const selectedEntity = this.fetch().targetEntity;
                    
                    // Trigger event so other fields can react
                    this.trigger('change');
                });
            }
        }
    });
});