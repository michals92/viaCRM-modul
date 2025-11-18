define('viacrm:extensions/views/record/kanban', ['views/record/kanban'], function (Dep) {

    return Dep.extend({

        template: 'viacrm:record/kanban',

        buildRows: function (callback) {
            var self = this;

            Dep.prototype.buildRows.call(this, function () {
                (self.groupDataList || []).forEach(function (item, i) {
                    var iconClass = item.iconClass ||
                        self.getMetadata().get(
                            ['entityDefs', self.scope, 'fields', self.statusField, 'icons', item.name],
                            null
                        );

                    item.iconClass = iconClass;

                    if (self.groupRawDataList && self.groupRawDataList[i]) {
                        item.color = self.groupRawDataList[i].color;
                    }
                });

                if (typeof callback === 'function') {
                    callback();
                }
            });
        }
    });
});

