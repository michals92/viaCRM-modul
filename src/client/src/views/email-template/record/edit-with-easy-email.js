define(['views/record/edit'], function (RecordEditView) {
    'use strict';

    return class extends RecordEditView {
        
        setup() {
            super.setup();
                        
            // Add Easy Email Editor button
            if (!this.buttonList) {
                this.buttonList = [];
            }
            
            this.buttonList.unshift({
                name: 'openEasyEmailEditor',
                label: 'Easy Email Editor',
                style: 'primary',
                title: 'Open Easy Email Editor'
            });
            
            // Watch for changes in Easy Email toggle
            this.listenTo(this.model, 'change:useEasyEmailEditor', () => {
                this.handleEasyEmailToggle();
            });
        }

        handleEasyEmailToggle() {
            const useEasyEmail = this.model.get('useEasyEmailEditor');
            
            // Get body field view
            const bodyFieldView = this.getView('body');
            
            if (bodyFieldView) {
                // Force re-render of body field
                setTimeout(() => {
                    bodyFieldView.reRender();
                }, 100);
            }
            
            // Show appropriate message
            if (useEasyEmail) {
                Espo.Ui.notify('Easy Email Editor enabled', 'success', 2000);
            } else {
                Espo.Ui.notify('Standard editor enabled', 'info', 2000);
            }
        }

        actionOpenEasyEmailEditor() {
            const templateId = this.model.id || 'new';
            const authToken = this.getUser().get('token') || '';
            const editorUrl = `${this.getConfig().get('siteUrl')}/?entryPoint=EasyEmailEditor&templateId=${encodeURIComponent(templateId)}&authToken=${encodeURIComponent(authToken)}&timestamp=${Date.now()}`;
                        
            // Open editor in new window/tab for full-screen experience
            const editorWindow = window.open(
                editorUrl, 
                'viacrm-email-editor', 
                'width=' + screen.width + ',height=' + screen.height + ',scrollbars=yes,resizable=yes,toolbar=no,location=no,directories=no,status=no,menubar=no'
            );
            
            if (editorWindow) {
                editorWindow.focus();
                
                // Listen for messages from the editor window
                const messageHandler = (event) => {
                    if (event.source !== editorWindow) return;
                    
                    switch(event.data.type) {
                        case 'EASY_EMAIL_SAVE':
                            this.handleEasyEmailSave(event.data.data);
                            break;
                            
                        case 'EASY_EMAIL_CLOSE':
                            editorWindow.close();
                            break;
                    }
                };
                
                window.addEventListener('message', messageHandler);
                
                // Clean up listener when window closes
                const checkClosed = setInterval(() => {
                    if (editorWindow.closed) {
                        window.removeEventListener('message', messageHandler);
                        clearInterval(checkClosed);
                    }
                }, 1000);
                
            } else {
                this.notify('Please allow popups for the email editor', 'warning');
            }
        }
        
        handleEasyEmailSave(data) {
            
            // Update model with saved data
            if (data.mjml) {
                this.model.set('bodyMjml', data.mjml);
            }
            if (data.html) {
                this.model.set('body', data.html);
            }
            if (data.subject) {
                this.model.set('subject', data.subject);
            }
            
            // Mark as using Easy Email Editor
            this.model.set('useEasyEmailEditor', true);
            
            // Show notification and trigger re-render
            Espo.Ui.success('Email template updated from Easy Email Editor');
            
            // Trigger field updates
            const bodyView = this.getView('body');
            const subjectView = this.getView('subject');
            
            if (bodyView) bodyView.reRender();
            if (subjectView) subjectView.reRender();
        }

        validate() {
            const result = super.validate();
            
            // Custom validation for Easy Email
            if (this.model.get('useEasyEmailEditor')) {
                const bodyMjml = this.model.get('bodyMjml');
                const body = this.model.get('body');
                
                if (!body && !bodyMjml) {
                    result.push({
                        field: 'body',
                        message: 'Email content is required when using Easy Email Editor'
                    });
                }
            }
            
            return result;
        }
    };
});
