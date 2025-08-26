define('viacrm:views/email-template/legendary-editor', ['view'], function (Dep) {

    return Dep.extend({

        template: 'viacrm:email-template/legendary-editor',

        setup: function () {
            this.templateId = this.options.templateId || 'new';
            this.model = this.options.model;
            
            // Load the model if we have an ID but no model
            if (this.templateId !== 'new' && !this.model) {
                this.wait(
                    this.getEntityManager().getEntity('EmailTemplate', this.templateId)
                        .then((model) => {
                            this.model = model;
                            console.log('📧 Loaded email template model:', model.get('name'));
                        })
                        .catch((error) => {
                            console.error('❌ Failed to load template:', error);
                            this.notify('Failed to load template', 'error');
                        })
                );
            }
            
            // Build the editor URL
            this.editorUrl = this.getConfig().get('siteUrl') + '/?entryPoint=EasyEmailEditor&templateId=' + 
                           encodeURIComponent(this.templateId) + '&timestamp=' + Date.now();
            
            // Set page title
            document.title = '🚀 Legendary Email Editor - ' + (this.model ? this.model.get('name') : 'New Template');
            
            this.listenTo(this, 'after:render', () => {
                this.initFullPageEditor();
            });
            
            // Listen for editor messages
            window.addEventListener('message', this.handleEditorMessage.bind(this));
        },

        initFullPageEditor: function () {
            const iframe = this.$el.find('#legendary-editor-iframe')[0];
            if (iframe) {
                iframe.src = this.editorUrl;
                console.log('🚀 Loading Legendary Email Editor in full page mode');
            }
        },

        handleEditorMessage: function (event) {
            if (!event.data || !event.data.type) return;
            
            switch (event.data.type) {
                case 'EASY_EMAIL_SAVE':
                    this.handleSave(event.data.data);
                    break;
                    
                case 'EASY_EMAIL_CLOSE':
                    this.handleClose();
                    break;
                    
                case 'EASY_EMAIL_READY':
                    this.handleEditorReady();
                    break;
            }
        },

        handleSave: function (data) {
            this.notify('Saving template...', 'info');
            
            // Save to backend
            this.ajaxPostRequest('EasyEmailEditor/action/saveTemplate', {
                templateId: this.templateId !== 'new' ? this.templateId : null,
                mjml: data.mjml,
                html: data.html,
                subject: data.subject
            }).then((response) => {
                if (response.success) {
                    this.notify('Template saved successfully! 🚀', 'success');
                    
                    // Update URL if it was a new template
                    if (this.templateId === 'new' && response.id) {
                        this.templateId = response.id;
                        const newUrl = '#EmailTemplate/edit/' + response.id + '/legendary';
                        this.getRouter().navigate(newUrl, {replace: true});
                    }
                }
            }).fail(() => {
                this.notify('Failed to save template', 'error');
            });
        },

        handleClose: function () {
            // Navigate back to email templates list
            this.getRouter().navigate('#EmailTemplate', {trigger: true});
        },

        handleEditorReady: function () {
            // Load existing template data if available
            if (this.model && this.model.get('bodyMjml')) {
                const iframe = this.$el.find('#legendary-editor-iframe')[0];
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
            window.removeEventListener('message', this.handleEditorMessage.bind(this));
            // Restore original page title
            document.title = 'EspoCRM';
        }
    });
});