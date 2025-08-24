define(['views/edit'], function (EditView) {
    'use strict';

    return class extends EditView {
        
        setup() {
            super.setup();
            
            console.log('ViaCRM: EmailTemplate edit view loaded successfully!');
            
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
            const url = `${this.getConfig().get('siteUrl')}/?entryPoint=EasyEmailEditor&templateId=${templateId}&entityType=EmailTemplate&mode=edit`;
            
            // Create modal with iframe
            this.createView('easyEmailModal', 'views/modal', {
                templateContent: `
                    <div class="easy-email-container" style="padding: 0; height: 80vh;">
                        <iframe src="${url}" 
                                style="width: 100%; height: 100%; border: none;" 
                                id="easyEmailFrame"></iframe>
                    </div>
                `,
                backdrop: true,
                className: 'dialog dialog-record easy-email-modal',
                header: 'Easy Email Editor',
                style: 'width: 95%; max-width: 1400px;',
                buttonList: [
                    {
                        name: 'close',
                        label: 'Close'
                    }
                ]
            }, (view) => {
                view.render(() => {
                    // Listen for messages from iframe
                    const messageHandler = (event) => {
                        console.log('Received message from Easy Email Editor:', event.data);
                        
                        switch(event.data.type) {
                            case 'EASY_EMAIL_SAVE':
                                this.handleEasyEmailSave(event.data.data);
                                break;
                                
                            case 'EASY_EMAIL_CLOSE':
                                view.close();
                                break;
                                
                            case 'EASY_EMAIL_READY':
                                console.log('Easy Email Editor is ready');
                                Espo.Ui.success('Easy Email Editor loaded successfully');
                                break;
                        }
                    };
                    
                    window.addEventListener('message', messageHandler);
                    
                    // Clean up listener when modal is closed
                    view.on('remove', () => {
                        window.removeEventListener('message', messageHandler);
                    });
                });
            });
        }
        
        handleEasyEmailSave(data) {
            console.log('Saving Easy Email data:', data);
            
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