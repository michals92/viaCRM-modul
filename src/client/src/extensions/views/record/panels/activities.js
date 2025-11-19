extend(Dep => class extends Dep {
	// This method is overridden to add accountId and accountName
	getCreateActivityAttributes(scope, data, callback) {
		data = data || {};

		const attributes = {
			status: data.status,
			accountId: this.model.get('accountId'), // Added accountId
			accountName: this.model.get('accountName'), // Added accountName
		};

		switch (this.model.entityType) {
			case 'User': {
				const model = /** @type {module:models/user} */ this.model;

				if (model.isPortal()) {
					attributes.usersIds = [model.id];
					const usersIdsNames = {};
					usersIdsNames[model.id] = model.get('name');
					attributes.usersIdsNames = usersIdsNames;
				} else {
					attributes.assignedUserId = model.id;
					attributes.assignedUserName = model.get('name');
				}
				break;
			}

			case 'Contact':
				if (this.model.get('accountId') && !this.getConfig().get('b2cMode')) {
					attributes.parentType = 'Account';
					attributes.parentId = this.model.get('accountId');
					attributes.parentName = this.model.get('accountName');
					if (
						scope &&
							!this.getMetadata().get(['entityDefs', scope, 'links', 'contacts']) &&
							!this.getMetadata().get(['entityDefs', scope, 'links', 'contact'])
					) {
						delete attributes.parentType;
						delete attributes.parentId;
						delete attributes.parentName;
					}
				}
				break;

			case 'Lead':
				attributes.parentType = 'Lead';
				attributes.parentId = this.model.id;
				attributes.parentName = this.model.get('name');
				break;

			default:
				break;
		}

		if (this.model.entityType !== 'Account' && this.model.has('contactsIds')) {
			attributes.contactsIds = this.model.get('contactsIds');
			attributes.contactsNames = this.model.get('contactsNames');
		}

		if (scope) {
			if (!attributes.parentId) {
				if (this.checkParentTypeAvailability(scope, this.model.entityType)) {
					attributes.parentType = this.model.entityType;
					attributes.parentId = this.model.id;
					attributes.parentName = this.model.get('name');
				}
			} else if (attributes.parentType && !this.checkParentTypeAvailability(scope, attributes.parentType)) {
				attributes.parentType = null;
				attributes.parentId = null;
				attributes.parentName = null;
			}
		}

		callback.call(this, Espo.Utils.cloneDeep(attributes));
	}
});
