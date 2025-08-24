define('viacrm:views/modals/easy-email-editor', ['views/modal'], function (Dep) {

    return Dep.extend({

        template: 'viacrm:modals/easy-email-editor',

        cssName: 'easy-email-editor-modal',

        className: 'dialog dialog-record',

        backdrop: true,

        fitHeight: true,

        buttons: [
            {
                name: 'cancel',
                label: 'Cancel'
            }
        ],

        setup: function () {
            this.header = this.translate('Easy Email Editor', 'labels');
            
            this.url = this.options.url;
            this.templateId = this.options.templateId;
            this.model = this.options.model;
            
            this.listenTo(this, 'after:render', () => {
                this.initIframe();
            });
        },

        initIframe: function () {
            const $iframe = $('<iframe>', {
                src: this.url,
                frameborder: 0,
                width: '100%',
                height: '600px',
                style: 'border: none; min-height: 600px;'
            });

            this.$el.find('.modal-body').html($iframe);
            
            // Listen for messages from iframe
            window.addEventListener('message', this.handleMessage.bind(this));
        },

        handleMessage: function (event) {
            if (!event.data || !event.data.type) return;
            
            switch (event.data.type) {
                case 'EASY_EMAIL_SAVE':
                    this.handleSave(event.data.data);
                    break;
                    
                case 'EASY_EMAIL_CLOSE':
                    this.close();
                    break;
                    
                case 'EASY_EMAIL_READY':
                    this.handleEditorReady();
                    break;
            }
        },

        handleSave: function (data) {
            // Save to backend
            this.ajaxPostRequest('EasyEmailEditor/action/saveTemplate', {
                templateId: this.templateId !== 'new' ? this.templateId : null,
                mjml: data.mjml,
                html: data.html,
                subject: data.subject
            }).then((response) => {
                if (response.success) {
                    this.trigger('save', data);
                    this.notify('Template saved successfully', 'success');
                    this.close();
                }
            }).fail(() => {
                this.notify('Failed to save template', 'error');
            });
        },

        handleEditorReady: function () {
            // Load existing template data if available
            if (this.model && this.model.get('bodyMjml')) {
                const iframe = this.$el.find('iframe')[0];
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'EASY_EMAIL_LOAD',
                        data: {
                            mjml: this.model.get('bodyMjml'),
                            subject: this.model.get('subject')
                        }
                    }, '*');
                }
            }
        },

        onRemove: function () {
            window.removeEventListener('message', this.handleMessage.bind(this));
        }
    });
});