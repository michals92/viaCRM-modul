define('viacrm:views/absence/modals/approval', ['views/modal'], function (Modal) {

    return Modal.extend({

        template: 'viacrm:absence/modals/approval',

        className: 'dialog dialog-record',

        backdrop: true,

        setup: function () {
            Modal.prototype.setup.call(this);

            this.action = this.options.action || 'approve';
            
            var headerKey = this.action === 'approve' ? 'Approve' : 'Reject';
            this.headerText = this.translate(headerKey, 'labels', 'Absence');

            this.buttonList = [
                {
                    name: this.action,
                    label: headerKey,
                    style: this.action === 'approve' ? 'success' : 'danger'
                },
                {
                    name: 'cancel',
                    label: 'Cancel'
                }
            ];

            this.createView('comment', 'views/fields/text', {
                el: this.getSelector() + ' .field[data-name="comment"]',
                mode: 'edit',
                defs: {
                    name: 'comment',
                    type: 'text'
                },
                model: this.model
            });
        },

        actionApprove: function () {
            var comment = this.getView('comment').fetch().comment;
            this.trigger('approve', {
                comment: comment
            });
        },

        actionReject: function () {
            var comment = this.getView('comment').fetch().comment;
            
            if (!comment) {
                this.getView('comment').showValidationMessage(
                    this.translate('commentRequiredForRejection', 'messages', 'Absence')
                );
                return;
            }
            
            this.trigger('reject', {
                comment: comment
            });
        }
    });
});