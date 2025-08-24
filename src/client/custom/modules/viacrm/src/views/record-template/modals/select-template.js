/**
 * VIA CRM Template Selection Modal
 */

define('viacrm:views/record-template/modals/select-template', ['views/modal', 'model'], function (Dep, Model) {

    return Dep.extend({

        className: 'dialog dialog-record',
        
        template: 'viacrm:record-template/modals/select-template',
        
        backdrop: true,
        
        setup: function () {
            this.headerText = this.translate('Select Template', 'labels', 'RecordTemplate');
            
            this.entityType = this.options.entityType;
            
            this.buttonList = [
                {
                    name: 'cancel',
                    label: 'Cancel'
                }
            ];
            
            this.wait(true);
            
            this.loadTemplates();
        },
        
        loadTemplates: function () {
            Espo.Ajax.getRequest('ViaCrm/RecordTemplate/templates/' + this.entityType).then(response => {
                this.templates = response.list || [];
                this.wait(false);
            }).catch(() => {
                this.templates = [];
                this.wait(false);
            });
        },
        
        data: function () {
            return {
                templates: this.templates,
                entityType: this.entityType,
                hasTemplates: this.templates && this.templates.length > 0
            };
        },
        
        actionSelectTemplate: function (data) {
            const templateId = data.id;
            const template = this.templates.find(t => t.id === templateId);
            
            if (template) {
                this.trigger('select', {
                    templateId: templateId,
                    template: template
                });
                this.close();
            }
        },
        
        actionCreateTemplate: function () {
            this.trigger('create-template');
            this.close();
        }

    });

});