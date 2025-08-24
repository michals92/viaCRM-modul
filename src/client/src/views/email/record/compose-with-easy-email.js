define('viacrm:views/email/record/compose-with-easy-email', ['views/email/record/compose'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Add Easy Email Editor button to compose view
            this.addButton({
                name: 'useEasyEmailEditor',
                label: 'Easy Email Editor',
                style: 'default',
                position: 'top'
            });
            
            this.listenTo(this, 'after:render', function () {
                this.setupEasyEmailToggle();
            });
        },

        setupEasyEmailToggle: function () {
            // Check if email has MJML data
            if (this.model.get('bodyMjml')) {
                this.showEasyEmailIndicator();
            }
        },

        showEasyEmailIndicator: function () {
            const $bodyField = this.$el.find('.field[data-name="body"]');
            
            if (!$bodyField.find('.easy-email-indicator').length) {
                $bodyField.before(
                    '<div class="easy-email-indicator alert alert-info">' +
                    '<i class="fas fa-palette"></i> ' +
                    'This email was created with Easy Email Editor. ' +
                    '<a href="javascript:" class="action-edit-easy-email">Edit with Easy Email</a>' +
                    '</div>'
                );
            }
            
            this.$el.off('click', '.action-edit-easy-email');
            this.$el.on('click', '.action-edit-easy-email', () => {
                this.actionUseEasyEmailEditor();
            });
        },

        actionUseEasyEmailEditor: function () {
            const emailId = this.model.id || null;
            const url = `?entryPoint=EasyEmailEditor&emailId=${emailId || ''}&entityType=Email&mode=compose`;
            
            // Open Easy Email Editor in modal
            this.createView('easyEmailModal', 'viacrm:views/modals/easy-email-composer', {
                url: url,
                emailId: emailId,
                model: this.model,
                isNew: !emailId
            }, (view) => {
                view.render();
                
                this.listenToOnce(view, 'save', (data) => {
                    this.handleEasyEmailSave(data);
                });
            });
        },

        handleEasyEmailSave: function (data) {
            // Update email model with Easy Email data
            if (data.mjml) {
                this.model.set('bodyMjml', data.mjml);
            }
            if (data.html) {
                this.model.set('body', data.html);
                this.model.set('isHtml', true);
            }
            if (data.subject) {
                this.model.set('subject', data.subject);
            }
            
            // Update body field view
            const bodyView = this.getFieldView('body');
            if (bodyView) {
                bodyView.model.set('body', data.html);
                bodyView.render();
            }
            
            // Show indicator
            this.showEasyEmailIndicator();
            
            this.notify('Email content updated', 'success');
        },

        send: function () {
            // Ensure MJML data is included when sending
            if (this.model.get('bodyMjml')) {
                this.model.set('usedEasyEmailEditor', true);
            }
            
            return Dep.prototype.send.call(this);
        },

        saveDraft: function () {
            // Ensure MJML data is saved with draft
            if (this.model.get('bodyMjml')) {
                this.model.set('usedEasyEmailEditor', true);
            }
            
            return Dep.prototype.saveDraft.call(this);
        }
    });
});