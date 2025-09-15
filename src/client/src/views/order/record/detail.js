define('viacrm:views/order/record/detail', ['views/record/detail'], function (Dep) {

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
                name: 'sendPdfEmail',
                label: 'Send PDF via Email'
            });

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
        },

        actionSendPdfEmail: function () {
            this.createView('pdfTemplate', 'views/modals/select-template', {
                entityType: this.model.entityType,
                entityId: this.model.id
            }, function (view) {
                view.render();
                
                this.listenToOnce(view, 'select', function (templateModel) {
                    // Get email from contact or account
                    var emailTo = '';
                    var parentId = null;
                    var parentType = null;
                    
                    if (this.model.get('contactId')) {
                        emailTo = this.model.get('contactEmailAddress') || '';
                        parentId = this.model.get('contactId');
                        parentType = 'Contact';
                    } else if (this.model.get('accountId')) {
                        emailTo = this.model.get('accountEmailAddress') || '';
                        parentId = this.model.get('accountId');
                        parentType = 'Account';
                    }
                    
                    // Use the modern PDF email modal with attachment functionality
                    this.createView('sendPdfEmail', 'viacrm:views/order/modals/send-pdf-email', {
                        attributes: {
                            to: emailTo,
                            name: this.model.get('name'),
                            subject: this.translate('Order', 'scopeNames') + ': ' + this.model.get('name'),
                            parentId: parentId,
                            parentType: parentType,
                            parentName: this.model.get('contactName') || this.model.get('accountName'),
                            body: this.translate('Please find attached PDF document', 'messages', 'Order') + '.\n\n'
                        },
                        selectTemplateDisabled: true,
                        signatureDisabled: false,
                        pdfTemplate: {
                            id: templateModel.id,
                            entityId: this.model.id,
                            entityType: this.model.entityType
                        }
                    }, function (view) {
                        view.render();
                        
                        this.listenToOnce(view, 'after:save', function () {
                            this.notify('Email sent successfully', 'success');
                        }, this);
                    }, this);
                }, this);
            }.bind(this));
        }
    });
});