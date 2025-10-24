define('custom:views/fields/date', ['views/fields/date'], function (Dep) {

    return Dep.extend({

        setup: function () {
            // Force useNumericFormat to true globally
            this.params.useNumericFormat = true;

            Dep.prototype.setup.call(this);
        }

    });
});
