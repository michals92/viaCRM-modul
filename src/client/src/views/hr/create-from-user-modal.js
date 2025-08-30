define('viacrm:views/hr/create-from-user-modal', ['views/modal', 'model'], function (Modal, Model) {

    return Modal.extend({

        template: 'viacrm:hr/create-from-user-modal',

        className: 'dialog dialog-record',

        backdrop: true,

        setup: function () {
            Modal.prototype.setup.call(this);

            this.headerText = this.translate('Create from User', 'labels', 'Hr');

            this.buttonList = [
                {
                    name: 'create',
                    label: 'Create',
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: 'Cancel'
                }
            ];

            this.userModel = new Model();
            this.userModel.name = 'User';
            this.userModel.urlRoot = 'User';

            this.createView('user', 'views/fields/link', {
                el: this.getSelector() + ' .field[data-name="user"]',
                model: this.userModel,
                mode: 'edit',
                defs: {
                    name: 'user',
                    type: 'link',
                    params: {
                        entity: 'User'
                    }
                }
            });
        },

        afterRender: function () {
            Modal.prototype.afterRender.call(this);
        },

        actionCreate: function () {
            var userId = this.userModel.get('userId');
            
            if (!userId) {
                Espo.Ui.error('Please select a user');
                return;
            }

            this.disableButton('create');
            
            // Nejdříve získej data uživatele
            Espo.Ajax.getRequest('User/' + userId).then(function (user) {
                
                // Vytvoř HR záznam s daty z uživatele
                var hrData = {
                    name: user.name || ((user.firstName || '') + ' ' + (user.lastName || '')).trim(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.emailAddress,
                    phone: user.phoneNumber,
                    status: 'Active',
                    assignedUserId: userId
                };
                
                // Pošli POST request pro vytvoření HR
                Espo.Ajax.postRequest('Hr', hrData).then(function (hrRecord) {
                    Espo.Ui.success('HR record created successfully');
                    this.trigger('created', {
                        id: hrRecord.id
                    });
                    this.close();
                }.bind(this)).catch(function (xhr) {
                    var message = 'Error creating HR record';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    }
                    Espo.Ui.error(message);
                    this.enableButton('create');
                }.bind(this));
                
            }.bind(this)).catch(function (xhr) {
                Espo.Ui.error('Error loading user data');
                this.enableButton('create');
            }.bind(this));
        }
    });
});