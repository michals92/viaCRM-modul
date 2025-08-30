define('viacrm:controllers/hr', ['controllers/record'], function (Controller) {

    return Controller.extend({

        actionCreateFromUser: function () {
            this.createView('modal', 'viacrm:views/hr/create-from-user-modal', {}, function (view) {
                view.render();
                
                this.listenToOnce(view, 'created', function (data) {
                    this.getRouter().navigate('#Hr/view/' + data.id, {trigger: true});
                }, this);
                
            }, this);
        }

    });
});