define('viacrm:views/absence/fields/half-day', ['views/fields/bool'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Listen to date changes
            this.listenTo(this.model, 'change:startDate change:endDate', function () {
                this.manageFieldVisibility();
            }, this);

            // Initial visibility check
            this.once('after:render', function () {
                this.manageFieldVisibility();
            }, this);
        },

        manageFieldVisibility: function () {
            var startDate = this.model.get('startDate');
            var endDate = this.model.get('endDate');

            if (startDate && endDate && startDate === endDate) {
                // Show the field when dates are the same
                this.$el.show();
                this.show();
            } else {
                // Hide the field when dates are different
                this.$el.hide();
                this.hide();
                // Reset value to false when hidden
                if (this.model.get('halfDay')) {
                    this.model.set('halfDay', false);
                }
            }
        }
    });
});