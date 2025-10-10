define('viacrm:views/invoice/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Add main action buttons
            
            // Print to PDF button
            this.addButton({
                name: 'printPdf',
                label: 'Print to PDF',
                style: 'default',
                acl: 'read',
                iconHtml: '<span class="fas fa-file-pdf"></span>'
            });
            
            // Send PDF via Email button
            this.addButton({
                name: 'sendPdfEmail',
                label: 'Send PDF via Email',
                style: 'default',
                acl: 'read',
                iconHtml: '<span class="fas fa-envelope"></span>'
            });
            
            // Only keep manage templates in dropdown
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
                
                this.listenToOnce(view, 'select', function (templateModel) {
                    window.open('?entryPoint=pdf&entityType=' + this.model.entityType + '&entityId=' + this.model.id + '&templateId=' + templateModel.id);
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
                    
                    if (this.model.get('contactPersonId')) {
                        emailTo = this.model.get('contactPersonEmailAddress') || '';
                        parentId = this.model.get('contactPersonId');
                        parentType = 'Contact';
                    } else if (this.model.get('accountId')) {
                        emailTo = this.model.get('accountEmailAddress') || '';
                        parentId = this.model.get('accountId');
                        parentType = 'Account';
                    }
                    
                    // Use the modern PDF email modal with attachment functionality
                    this.createView('sendPdfEmail', 'viacrm:views/invoice/modals/send-pdf-email', {
                        attributes: {
                            to: emailTo,
                            name: this.model.get('name'),
                            subject: this.translate('Invoice', 'scopeNames') + ': ' + this.model.get('name'),
                            parentId: parentId,
                            parentType: parentType,
                            parentName: this.model.get('contactPersonName') || this.model.get('accountName'),
                            body: this.translate('Please find attached PDF document', 'messages', 'Invoice') + '.\n\n'
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