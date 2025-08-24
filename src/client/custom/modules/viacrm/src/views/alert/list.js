define('custom:views/alert/list', ['views/list'], function (Dep) {

    return Dep.extend({

        searchPanel: true,

        setup: function () {
            Dep.prototype.setup.call(this);

            // Custom setup for Alert list view
            this.menu.buttons.unshift({
                action: 'createGlobalAlert',
                label: 'Create Global Alert',
                style: 'primary',
                acl: 'create',
            });
        },

        actionCreateGlobalAlert: function () {
            this.actionQuickCreate({
                attributes: {
                    isGlobal: true,
                    status: 'Active'
                }
            });
        }

    });

});