define('viacrm:views/site/navbar/toggle-field-names', ['views/site/navbar/item'], function (Dep) {

    return Dep.extend({

        template: 'viacrm:site/navbar/toggle-field-names',

        status: 'disabled',

        setup: function () {
            Dep.prototype.setup.call(this);

            try {
                var stored = window.localStorage.getItem('displayInternalFieldNames');
                if (stored) {
                    this.status = stored;
                }
            } catch (e) {
                // ignore storage errors
            }

            this.addActionHandler('toggleFieldNames', function () {
                if (window.Espo && window.Espo.Ui && typeof window.Espo.Ui.notifyWait === 'function') {
                    window.Espo.Ui.notifyWait();
                }

                var currentStatus = this.status || 'disabled';
                var newStatus;

                if (currentStatus === 'disabled') {
                    newStatus = 'enabled';
                } else if (currentStatus === 'enabled') {
                    newStatus = 'hidden';
                } else {
                    newStatus = 'disabled';
                }

                this.status = newStatus;

                try {
                    window.localStorage.setItem('displayInternalFieldNames', newStatus);
                } catch (e) {
                    // ignore storage errors
                }

                if (window.Espo && window.Espo.Ui && typeof window.Espo.Ui.success === 'function') {
                    window.Espo.Ui.success(this.translate('Done'));
                }

                window.dispatchEvent(new CustomEvent('displayInternalFieldNamesChanged', {
                    detail: { newValue: newStatus }
                }));

                this.reRender();
            }.bind(this));
        },

        data: function () {
            var data = Dep.prototype.data.call(this);

            data.status = this.status;

            return data;
        }
    });
});

