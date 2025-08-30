define('viacrm:views/hr/list', ['views/list'], function (Dep) {

    return Dep.extend({

        actionCreateFromUser: function () {
            console.log('List view actionCreateFromUser called');
            
            this.createView('modal', 'viacrm:views/hr/create-from-user-modal', {}, function (view) {
                console.log('Modal view created from list');
                view.render();
                
                this.listenToOnce(view, 'created', function (data) {
                    console.log('HR record created from list:', data);
                    this.getRouter().navigate('#Hr/view/' + data.id, {trigger: true});
                }, this);
                
            }, this);
        }

    });
});