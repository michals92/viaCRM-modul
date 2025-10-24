define('custom:views/fields/datetime', ['views/fields/datetime'], function (Dep) {

    return Dep.extend({

        setup: function () {
            // Force useNumericFormat to true globally
            this.params.useNumericFormat = true;

            Dep.prototype.setup.call(this);
        }

    });
});
