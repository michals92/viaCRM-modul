define(['views/edit'], function (EditView) {
    'use strict';

    return class extends EditView {
        
        setup() {
            super.setup();
                        
            // Initialize buttonList if it doesn't exist
            if (!this.buttonList) {
                this.buttonList = [];
            }
            
            // Add Easy Email Editor button
            this.buttonList.unshift({
                name: 'openEasyEmailEditor',
                label: 'Open Easy Email Editor',
                style: 'primary',
                title: 'Open Easy Email Editor'
            });
            
            // Listen for changes to easy email editor toggle
            this.listenTo(this.model, 'change:useEasyEmailEditor', () => {
                this.handleEditorToggle();
            });
        }

        afterRender() {
            super.afterRender();
            
            // Add info about Easy Email Editor
            this.addEasyEmailInfo();
        }

        handleEditorToggle() {
            const useEasyEmail = this.model.get('useEasyEmailEditor');
            
            if (useEasyEmail) {
                Espo.Ui.notify('Switching to Easy Email Editor...');
                
                // Trigger re-render of body field
                const bodyView = this.getView('record').getView('body');
                if (bodyView) {
                    bodyView.reRender();
                }
            } else {
                Espo.Ui.notify('Switching to Standard Editor...');
                
                // Trigger re-render of body field
                const bodyView = this.getView('record').getView('body');
                if (bodyView) {
                    bodyView.reRender();
                }
            }
        }

        addEasyEmailInfo() {
            const $header = this.$el.find('.page-header h3');
            
            if ($header.length && this.model.get('useEasyEmailEditor')) {
                const $badge = $('<span>')
                    .addClass('label label-info')
                    .text('Easy Email')
                    .css('margin-left', '10px');
                    
                $header.append($badge);
            }
        }

        actionOpenEasyEmailEditor() {
            const templateId = this.model.id || 'new';
            const authToken = this.getUser().get('token') || '';
            const editorUrl = `${this.getConfig().get('siteUrl')}/?entryPoint=EasyEmailEditor&templateId=${encodeURIComponent(templateId)}&authToken=${encodeURIComponent(authToken)}&timestamp=${Date.now()}`;
                        
            // Open editor in new window/tab for full-screen experience
            const editorWindow = window.open(
                editorUrl, 
                'legendary-email-editor', 
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
                this.notify('Please allow popups for the legendary email editor', 'warning');
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
            const recordView = this.getView('record');
            if (recordView) {
                const bodyView = recordView.getView('body');
                const subjectView = recordView.getView('subject');
                
                if (bodyView) bodyView.reRender();
                if (subjectView) subjectView.reRender();
            }
        }

        save() {
            // Custom save logic if needed
            const useEasyEmail = this.model.get('useEasyEmailEditor');
            
            if (useEasyEmail) {
                // Ensure we have the MJML data
                const bodyMjml = this.model.get('bodyMjml');
                if (!bodyMjml && this.model.get('body')) {
                    console.warn('Easy Email: MJML data missing, but HTML content exists');
                }
            }
            
            return super.save();
        }
    };
});