define('custom:views/record-template/list', ['views/list'], function (Dep) {

    return Dep.extend({

        searchPanel: true,

        setup: function () {
            Dep.prototype.setup.call(this);

            // Custom setup for RecordTemplate list view
            this.menu.buttons.unshift({
                action: 'createTemplate',
                label: 'Create Template',
                style: 'primary',
                acl: 'create',
            });
        },

        actionCreateTemplate: function () {
            this.actionQuickCreate({
                attributes: {
                    isActive: true,
                    isGlobal: false
                }
            });
        }

    });

});