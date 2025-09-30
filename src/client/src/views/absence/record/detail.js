define('viacrm:views/absence/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            this.listenTo(this.model, 'change:startDate change:endDate', function () {
                this.manageHalfDayVisibility();
            }, this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.manageHalfDayVisibility();
        },

        manageHalfDayVisibility: function () {
            var startDate = this.model.get('startDate');
            var endDate = this.model.get('endDate');
            
            if (!this.getFieldView('halfDay')) {
                return;
            }

            if (startDate && endDate && startDate === endDate) {
                this.showField('halfDay');
            } else {
                this.hideField('halfDay');
                if (this.mode === 'edit') {
                    this.model.set('halfDay', false);
                }
            }
        }
    });
});