define(['views/record/edit'], function (RecordEditView) {
    'use strict';

    return class extends RecordEditView {
        
        setup() {
            super.setup();
            
            console.log('ViaCRM: EmailTemplate record edit view loaded successfully!');
            
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