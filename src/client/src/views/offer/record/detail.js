define('viacrm:views/offer/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Check if Print to PDF button already exists
            var hasPrintPdf = this.dropdownItemList.some(function(item) {
                return item.name === 'printPdf';
            });
            
            if (!hasPrintPdf) {
                this.dropdownItemList.push({
                    name: 'printPdf',
                    label: 'Print to PDF'
                });
            }

            this.dropdownItemList.push({
                name: 'managePdfTemplates',
                label: 'Manage PDF Templates'
            });
        },

        actionPrintPdf: function () {
            this.createView('pdfTemplate', 'views/modals/select-template', {
                entityType: this.model.entityType,
                entityId: this.model.id
            }, function (view) {
                view.render();
                
                this.listenToOnce(view, 'select', function (model) {
                    window.open(
                        '?entryPoint=pdf&entityType=' + this.model.entityType + 
                        '&entityId=' + this.model.id + 
                        '&templateId=' + model.id,
                        '_blank'
                    );
                }, this);
            }.bind(this));
        },

        actionManagePdfTemplates: function () {
            var url = '#Template/list/entityType=' + encodeURIComponent(this.model.entityType);
            this.getRouter().navigate(url, {trigger: true});
        }
    });
});