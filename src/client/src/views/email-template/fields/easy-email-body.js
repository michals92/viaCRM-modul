define(['views/fields/base'], function (FieldView) {
    'use strict';

    return class extends FieldView {
        
        setup() {
            super.setup();
            
            this.useEasyEmail = this.model.get('useEasyEmailEditor') || false;
            
            // Listen for changes to the easy email toggle
            this.listenTo(this.model, 'change:useEasyEmailEditor', () => {
                this.useEasyEmail = this.model.get('useEasyEmailEditor') || false;
                this.reRender();
            });
        }

        afterRender() {
            super.afterRender();
            
            if (this.useEasyEmail && this.mode === 'edit') {
                this.createEasyEmailEditor();
            }
        }

        createEasyEmailEditor() {
            const container = this.$el.find('[data-name="' + this.name + '"]');
            
            if (container.length === 0) {
                console.warn('Easy Email: Container not found for field', this.name);
                return;
            }

            // Clear existing content
            container.empty();

            // Create iframe container
            const iframeContainer = $('<div>')
                .css({
                    width: '100%',
                    height: '600px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    position: 'relative'
                });

            // Create toolbar
            const toolbar = $('<div>')
                .css({
                    background: '#f8f9fa',
                    padding: '10px',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                });

            toolbar.append(
                $('<span>').text('Easy Email Editor').css('font-weight', 'bold'),
                $('<div>').append(
                    $('<button>')
                        .addClass('btn btn-default btn-sm')
                        .text('Preview')
                        .on('click', () => this.previewEmail()),
                    ' ',
                    $('<button>')
                        .addClass('btn btn-primary btn-sm')
                        .text('Save & Close')
                        .on('click', () => this.saveAndClose())
                )
            );

            // Create iframe
            const iframe = $('<iframe>')
                .attr({
                    src: this.getEditorUrl(),
                    frameborder: '0'
                })
                .css({
                    width: '100%',
                    height: '550px',
                    border: 'none'
                });

            iframeContainer.append(toolbar, iframe);
            container.append(iframeContainer);

            // Setup PostMessage listener
            this.setupPostMessageListener(iframe[0]);
        }

        getEditorUrl() {
            const params = new URLSearchParams({
                templateId: this.model.id || '',
                entityType: 'EmailTemplate',
                mode: 'edit'
            });

            return `?entryPoint=EasyEmailEditor&${params.toString()}`;
        }

        setupPostMessageListener(iframe) {
            this.postMessageHandler = (event) => {
                if (event.source !== iframe.contentWindow) {
                    return;
                }

                const { type, data } = event.data;

                switch (type) {
                    case 'EASY_EMAIL_READY':
                        console.log('Easy Email Editor ready');
                        this.sendContentToEditor(iframe);
                        break;

                    case 'EASY_EMAIL_SAVE':
                        console.log('Saving email data from editor:', data);
                        this.handleSaveFromEditor(data);
                        break;

                    case 'EASY_EMAIL_CLOSE':
                        console.log('Editor requested close');
                        this.closeEditor();
                        break;

                    default:
                        console.log('Unknown message type:', type);
                }
            };

            window.addEventListener('message', this.postMessageHandler);
        }

        sendContentToEditor(iframe) {
            const currentContent = {
                mjml: this.model.get('bodyMjml') || null,
                html: this.model.get('body') || '',
                subject: this.model.get('subject') || ''
            };

            iframe.contentWindow.postMessage({
                type: 'EASY_EMAIL_LOAD',
                data: currentContent
            }, '*');
        }

        handleSaveFromEditor(data) {
            // Update model with data from editor
            this.model.set({
                'body': data.html || '',
                'bodyMjml': data.mjml || '',
                'subject': data.subject || this.model.get('subject')
            });

            // Trigger change event
            this.trigger('change');
            
            // Show success message
            Espo.Ui.success(this.translate('Saved'));
        }

        previewEmail() {
            const html = this.model.get('body');
            if (!html) {
                Espo.Ui.warning('No content to preview');
                return;
            }

            const previewWindow = window.open('', '_blank');
            if (previewWindow) {
                previewWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Email Preview</title>
                    </head>
                    <body style="margin: 0; padding: 20px; background: #f0f0f0;">
                        ${html}
                    </body>
                    </html>
                `);
                previewWindow.document.close();
            }
        }

        saveAndClose() {
            // The save already happened via PostMessage
            // Just show message
            Espo.Ui.success('Content saved');
            
            // Optionally close the editor view
            this.closeEditor();
        }

        closeEditor() {
            // Switch back to standard editor
            this.useEasyEmail = false;
            this.reRender();
        }

        onRemove() {
            // Clean up PostMessage listener
            if (this.postMessageHandler) {
                window.removeEventListener('message', this.postMessageHandler);
                this.postMessageHandler = null;
            }
            
            super.onRemove();
        }

        getValueForDisplay() {
            if (this.useEasyEmail && this.mode === 'detail') {
                // In detail mode, show a preview or summary
                const html = this.model.get('body') || '';
                if (html.length > 100) {
                    return html.substring(0, 100) + '... (Easy Email)';
                }
                return html + ' (Easy Email)';
            }
            
            return super.getValueForDisplay();
        }
    };
});