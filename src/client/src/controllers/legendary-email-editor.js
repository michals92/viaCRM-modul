define('viacrm:controllers/legendary-email-editor', ['controller'], function (Controller) {

    return Controller.extend({

        defaultAction: 'edit',

        edit: function (options) {
            const id = options.id || 'new';
            
            console.log('🚀 Legendary Email Editor Controller - Loading for ID:', id);
            
            this.main('viacrm:views/email-template/legendary-editor', {
                templateId: id
            });
        }
        
    });
});