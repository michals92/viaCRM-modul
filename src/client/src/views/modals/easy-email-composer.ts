define('viacrm:views/modals/easy-email-composer', ['viacrm:views/modals/easy-email-editor'], function (Dep) {

    return Dep.extend({

        setup: function () {
            this.header = this.translate('Compose with Easy Email', 'labels');
            
            this.url = this.options.url;
            this.emailId = this.options.emailId;
            this.model = this.options.model;
            this.isNew = this.options.isNew;
            
            this.buttons = [
                {
                    name: 'save',
                    label: 'Apply',
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: 'Cancel'
                }
            ];
            
            this.listenTo(this, 'after:render', () => {
                this.initIframe();
            });
        },

        actionSave: function () {
            // Send save command to iframe
            const iframe = this.$el.find('iframe')[0];
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'EASY_EMAIL_REQUEST_SAVE'
                }, '*');
            }
        },

        handleSave: function (data) {
            if (this.isNew) {
                // For new emails, just update the model
                this.trigger('save', data);
                this.close();
            } else {
                // For existing emails, save to backend
                this.ajaxPostRequest('EasyEmailEditor/action/saveEmail', {
                    emailId: this.emailId,
                    mjml: data.mjml,
                    html: data.html,
                    subject: data.subject
                }).then((response) => {
                    if (response.success) {
                        this.trigger('save', data);
                        this.notify('Email saved successfully', 'success');
                        this.close();
                    }
                }).fail(() => {
                    this.notify('Failed to save email', 'error');
                });
            }
        },

        handleEditorReady: function () {
            // Load existing email data if available
            if (this.model) {
                const iframe = this.$el.find('iframe')[0];
                if (iframe && iframe.contentWindow) {
                    const data = {
                        type: 'EASY_EMAIL_LOAD',
                        data: {}
                    };
                    
                    if (this.model.get('bodyMjml')) {
                        data.data.mjml = this.model.get('bodyMjml');
                    } else if (this.model.get('body')) {
                        // Convert HTML to basic MJML structure if no MJML exists
                        data.data.html = this.model.get('body');
                    }
                    
                    if (this.model.get('subject')) {
                        data.data.subject = this.model.get('subject');
                    }
                    
                    iframe.contentWindow.postMessage(data, '*');
                }
            }
        }
    });
});