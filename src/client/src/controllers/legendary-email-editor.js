define('viacrm:controllers/legendary-email-editor', ['controller'], function (Controller) {

    return Controller.extend({

        defaultAction: 'edit',

        edit: function (options) {
            const id = options.id || 'new';

            this.main('viacrm:views/email-template/legendary-editor', {
                templateId: id
            });
        }
        
    });
});