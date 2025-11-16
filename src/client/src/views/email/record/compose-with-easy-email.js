define('viacrm:views/email/record/compose-with-easy-email', ['views/email/record/compose'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            this.addButton({ name: 'useEasyEmailEditor', label: 'Easy Email Editor', style: 'default', position: 'top' });
        },

        setupEasyEmailToggle: function () {},
        showEasyEmailIndicator: function () {},

        actionUseEasyEmailEditor: function () {
            const emailId = this.model.id || '';
            const url = `?entryPoint=EasyEmailEditor&emailId=${encodeURIComponent(emailId)}&entityType=Email&mode=compose&authToken=${encodeURIComponent(this.getUser().get('token') || '')}`;
            const editorWindow = window.open(url, 'viacrm-email-editor', `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes`);
            if (!editorWindow) { this.notify('Please allow popups for the email editor', 'warning'); return; }
            editorWindow.focus();
            const handler = (event) => {
                if (event.source !== editorWindow) return;
                if (!event.data || !event.data.type) return;
                if (event.data.type === 'EASY_EMAIL_SAVE') this.handleEasyEmailSave(event.data.data || {});
            };
            window.addEventListener('message', handler);
            const iv = setInterval(() => { if (editorWindow.closed) { window.removeEventListener('message', handler); clearInterval(iv); } }, 1000);
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
