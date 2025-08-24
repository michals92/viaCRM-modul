define('custom:views/record-template/detail', ['views/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Add custom buttons for RecordTemplate detail view
            this.dropdownItemList.push({
                'label': 'Create Record from Template',
                'name': 'createFromTemplate'
            });

            if (!this.model.get('isGlobal')) {
                this.dropdownItemList.push({
                    'label': 'Make Global',
                    'name': 'makeGlobal'
                });
            }
        },

        actionCreateFromTemplate: function () {
            const entityType = this.model.get('entityType');
            const templateData = this.model.get('data') || {};

            if (!entityType) {
                Espo.Ui.error(this.translate('No entity type specified'));
                return;
            }

            this.getRouter().navigate('#' + entityType + '/create', {trigger: true});
            
            // Note: In a real implementation, you would pass the template data
            // to the create view to pre-populate the form
        },

        actionMakeGlobal: function () {
            this.model.set('isGlobal', true);
            this.model.save().then(() => {
                Espo.Ui.success(this.translate('Template is now global'));
                this.reRender();
            });
        }

    });

});