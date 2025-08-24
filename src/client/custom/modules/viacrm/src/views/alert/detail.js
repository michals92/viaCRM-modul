define('custom:views/alert/detail', ['views/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Add custom buttons for Alert detail view
            if (this.model.get('status') === 'Active') {
                this.dropdownItemList.push({
                    'label': 'Deactivate Alert',
                    'name': 'deactivateAlert'
                });
            }

            if (this.model.get('status') === 'Draft') {
                this.dropdownItemList.push({
                    'label': 'Activate Alert',
                    'name': 'activateAlert'
                });
            }
        },

        actionDeactivateAlert: function () {
            this.model.set('status', 'Archived');
            this.model.save().then(() => {
                Espo.Ui.success(this.translate('Alert deactivated'));
                this.reRender();
            });
        },

        actionActivateAlert: function () {
            this.model.set('status', 'Active');
            this.model.save().then(() => {
                Espo.Ui.success(this.translate('Alert activated'));
                this.reRender();
            });
        }

    });

});