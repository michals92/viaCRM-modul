define('viacrm:views/dashlets/fields/search-filters', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        detailTemplate: 'viacrm:dashlets/fields/search-filters/detail',
        editTemplate: 'viacrm:dashlets/fields/search-filters/edit',

        events: {
            'click [data-action="selectFilters"]': function () {
                this.actionSelectFilters();
            }
        },

        data: function () {
            const data = Dep.prototype.data.call(this);
            
            // Get entity type from parent view
            const entityType = this.model.get('entityType');
            data.entityType = entityType;
            
            // Format filters for display
            data.filterText = this.getFilterDisplayText();
            
            return data;
        },

        getFilterDisplayText: function () {
            const searchData = this.model.get(this.name) || {};
            const entityType = this.model.get('entityType');
            
            if (!searchData || Object.keys(searchData).length === 0) {
                return this.translate('None', 'labels');
            }
            
            // Simple display of filter count
            let count = 0;
            if (searchData.primary) count++;
            if (searchData.bool) count += Object.keys(searchData.bool).length;
            if (searchData.where) count += searchData.where.length;
            
            return count + ' filter(s) applied';
        },

        actionSelectFilters: function () {
            const entityType = this.model.get('entityType');
            
            if (!entityType) {
                Espo.Ui.error('Please select Entity Type first');
                return;
            }

            // Get current search data
            const currentSearchData = this.model.get(this.name) || {};
            
            // Create a simple filter selection modal
            this.createView('modal', 'viacrm:views/modals/simple-filters', {
                scope: entityType,
                entityType: entityType,
                searchData: currentSearchData
            }, (view) => {
                view.render();
                
                this.listenToOnce(view, 'apply', (searchData) => {
                    // Save the search data
                    this.model.set(this.name, searchData);
                    this.render();
                    
                    // Save the dashlet options
                    if (this.parent && this.parent.parent && this.parent.parent.save) {
                        this.parent.parent.save();
                    }
                });
            });
        },

        fetch: function () {
            const data = {};
            const value = this.model.get(this.name);
            
            data[this.name] = value || {};
            
            return data;
        }
    });
});