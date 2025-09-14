define('viacrm:views/modals/easy-email-editor', ['views/modal'], function (Dep) {

    return Dep.extend({

        template: 'viacrm:modals/easy-email-editor',

        cssName: 'easy-email-editor-modal',

        className: 'dialog dialog-record legendary-email-modal',

        backdrop: true,

        fitHeight: true,
        
        // Make modal extra wide for the legendary editor
        size: 'x-large',

        buttons: [
            {
                name: 'cancel',
                label: 'Cancel'
            }
        ],

        setup: function () {
            this.header = this.translate('🚀 Legendary Email Editor', 'labels');
            
            this.url = this.options.url;
            this.templateId = this.options.templateId;
            this.model = this.options.model;
            
            // Redirect to full-page editor instead of showing modal
            this.redirectToFullPageEditor();
        },
        
        redirectToFullPageEditor: function() {
            const templateId = this.templateId || 'new';
            let route;
            
            if (templateId === 'new') {
                route = '#EmailTemplate/create/legendary';
            } else {
                route = '#EmailTemplate/edit/' + templateId + '/legendary';
            }
            
            // Close modal and navigate to full-page editor
            this.close();
            
            setTimeout(() => {
                this.getRouter().navigate(route, {trigger: true});
            }, 100);
        },
        
        addCustomCSS: function() {
            const style = document.createElement('style');
            style.textContent = `
                .legendary-email-modal .modal-dialog {
                    max-width: 98vw !important;
                    width: 98vw !important;
                    margin: 1vh auto !important;
                }
                
                .legendary-email-modal .modal-content {
                    height: 98vh !important;
                    max-height: 98vh !important;
                }
                
                .legendary-email-modal .modal-body {
                    height: calc(98vh - 120px) !important;
                    max-height: calc(98vh - 120px) !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                }
                
                .legendary-email-modal iframe {
                    width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                    display: block !important;
                }
                
                .legendary-email-modal .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    border-bottom: none !important;
                }
                
                .legendary-email-modal .modal-header .modal-title {
                    color: white !important;
                    font-weight: 700 !important;
                }
                
                .legendary-email-modal .modal-header .close {
                    color: white !important;
                    opacity: 0.8 !important;
                }
                
                .legendary-email-modal .modal-header .close:hover {
                    opacity: 1 !important;
                }
                
                .legendary-email-modal .modal-footer {
                    background: rgba(248, 250, 252, 0.8) !important;
                    backdrop-filter: blur(20px) !important;
                    border-top: 1px solid rgba(102, 126, 234, 0.1) !important;
                }
            `;
            document.head.appendChild(style);
        },

        initIframe: function () {
            const $iframe = $('<iframe>', {
                src: this.url,
                frameborder: 0,
                width: '100%',
                height: '100%',
                style: 'border: none; display: block;'
            });

            // Clear the loading state and add iframe
            this.$el.find('.modal-body').html($iframe);
            
            // Listen for messages from iframe
            window.addEventListener('message', this.handleMessage.bind(this));
            
            // Focus iframe when ready
            $iframe.on('load', function() {
            });
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