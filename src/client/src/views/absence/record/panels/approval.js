define('viacrm:views/absence/record/panels/approval', ['views/record/panels/side'], function (Dep) {

    return Dep.extend({

        template: 'viacrm:absence/record/panels/approval',

        actionList: [
            {
                label: 'Approve',
                action: 'approve',
                style: 'success',
                acl: 'edit'
            },
            {
                label: 'Reject', 
                action: 'reject',
                style: 'danger',
                acl: 'edit'
            }
        ],

        buttonList: [],

        setup: function () {
            Dep.prototype.setup.call(this);

            this.listenTo(this.model, 'change:status', function () {
                this.reRender();
                this.setupActionButtons();
            }.bind(this));

            this.setupActionButtons();
        },

        setupActionButtons: function () {
            this.buttonList = [];
            
            var status = this.model.get('status');
            var requestedById = this.model.get('requestedById');
            var currentUserId = this.getUser().id;
            
            // Don't show approval buttons for own requests
            if (requestedById === currentUserId) {
                return;
            }
            
            if (status === 'pending' && this.getAcl().check(this.model, 'edit')) {
                this.buttonList.push({
                    name: 'approve',
                    label: 'Approve',
                    style: 'success'
                });
                
                this.buttonList.push({
                    name: 'reject',
                    label: 'Reject',
                    style: 'danger'
                });
            }
        },

        actionApprove: function () {
            this.confirm(this.translate('confirmApprove', 'messages', 'Absence'), function () {
                this.createView('approvalModal', 'viacrm:views/absence/modals/approval', {
                    model: this.model,
                    action: 'approve'
                }, function (view) {
                    view.render();
                    
                    this.listenTo(view, 'approve', function (data) {
                        this.approve(data.comment);
                        view.close();
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },

        actionReject: function () {
            this.createView('approvalModal', 'viacrm:views/absence/modals/approval', {
                model: this.model,
                action: 'reject'
            }, function (view) {
                view.render();
                
                this.listenTo(view, 'reject', function (data) {
                    this.reject(data.comment);
                    view.close();
                }.bind(this));
            }.bind(this));
        },

        approve: function (comment) {
            Espo.Ui.notify(this.translate('pleaseWait', 'messages'));
            
            Espo.Ajax.postRequest('Absence/action/approve', {
                id: this.model.id,
                approverComment: comment
            }).then(function (result) {
                this.model.set(result);
                Espo.Ui.success(this.translate('approvedSuccessfully', 'messages', 'Absence'));
                this.reRender();
            }.bind(this)).catch(function (xhr) {
                var message = 'Error occurred';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                Espo.Ui.error(message);
            });
        },

        reject: function (comment) {
            if (!comment) {
                Espo.Ui.error(this.translate('commentRequiredForRejection', 'messages', 'Absence'));
                return;
            }
            
            Espo.Ui.notify(this.translate('pleaseWait', 'messages'));
            
            Espo.Ajax.postRequest('Absence/action/reject', {
                id: this.model.id,
                approverComment: comment
            }).then(function (result) {
                this.model.set(result);
                Espo.Ui.success(this.translate('rejectedSuccessfully', 'messages', 'Absence'));
                this.reRender();
            }.bind(this)).catch(function (xhr) {
                var message = 'Error occurred';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                Espo.Ui.error(message);
            });
        },

        getFieldViews: function () {
            var fields = {};
            
            if (this.hasView('status')) {
                fields.status = this.getView('status');
            }
            if (this.hasView('approvedBy')) {
                fields.approvedBy = this.getView('approvedBy');
            }
            if (this.hasView('approvedAt')) {
                fields.approvedAt = this.getView('approvedAt');
            }
            if (this.hasView('approverComment')) {
                fields.approverComment = this.getView('approverComment');
            }
            
            return fields;
        }
    });
});