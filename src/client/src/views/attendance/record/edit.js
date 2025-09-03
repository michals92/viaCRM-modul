define('viacrm:views/attendance/record/edit', ['views/record/edit'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Set default values for new records
            if (this.model.isNew()) {
                // Set current user as default
                this.model.set('userId', this.getUser().id);
                this.model.set('userName', this.getUser().get('name'));
                
                // Set current local datetime as arrival date
                var now = new Date();
                var year = now.getFullYear();
                var month = ('0' + (now.getMonth() + 1)).slice(-2);
                var day = ('0' + now.getDate()).slice(-2);
                var hours = ('0' + now.getHours()).slice(-2);
                var minutes = ('0' + now.getMinutes()).slice(-2);
                var seconds = ('0' + now.getSeconds()).slice(-2);
                
                var localDateTime = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
                this.model.set('arrivalDate', localDateTime);
                
                console.log('Setting arrival date to local time:', localDateTime);
            }
        }

    });

});