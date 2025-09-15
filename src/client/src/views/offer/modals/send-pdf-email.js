define('viacrm:views/offer/modals/send-pdf-email', ['views/modals/compose-email'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            this.headerText = this.translate('Send PDF via Email', 'labels', 'Offer');
            
            // Handle PDF attachment generation
            if (this.options.pdfTemplate) {
                this.once('after:render', function () {
                    this.generatePdfAttachment();
                }, this);
            }
        },

        generatePdfAttachment: function () {
            var pdfTemplate = this.options.pdfTemplate;
            
            Espo.Ajax.postRequest('Offer/action/generatePdfWithAttachment', {
                entityId: pdfTemplate.entityId,
                templateId: pdfTemplate.id
            }).then(function (attachment) {
                if (attachment && attachment.id) {
                    // Get current attachments or initialize empty array
                    var attachmentIds = this.model.get('attachmentsIds') || [];
                    var attachmentNames = this.model.get('attachmentsNames') || {};
                    
                    // Add new attachment
                    attachmentIds.push(attachment.id);
                    attachmentNames[attachment.id] = attachment.name;
                    
                    // Update model
                    this.model.set('attachmentsIds', attachmentIds);
                    this.model.set('attachmentsNames', attachmentNames);
                    
                    // Trigger change event to update view
                    this.model.trigger('change:attachmentsIds');
                    
                    Espo.Ui.notify(this.translate('PDF attached', 'messages'), 'success');
                }
            }.bind(this)).catch(function (xhr) {
                var errorMessage = 'Error generating PDF';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                Espo.Ui.notify(errorMessage, 'error');
            }.bind(this));
        }
    });
});