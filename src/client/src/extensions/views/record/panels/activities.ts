import type ActivitiesPanelView from 'espocrm/src/views/record/panels/activities';
import type Model from 'espocrm/src/model';

interface ActivityAttributes {
	status?: string;
	accountId?: string;
	accountName?: string;
	usersIds?: string[];
	usersIdsNames?: Record<string, string>;
	assignedUserId?: string;
	assignedUserName?: string;
	parentType?: string | null;
	parentId?: string | null;
	parentName?: string | null;
	contactsIds?: string[];
	contactsNames?: Record<string, string>;
}

interface UserModel extends Model {
	isPortal(): boolean;
}

extend<ActivitiesPanelView>(Dep => class extends Dep {
	model!: Model;

	// This method is overridden to add accountId and accountName
	getCreateActivityAttributes(scope: string, data: { status?: string } | undefined, callback: (attributes: ActivityAttributes) => void): void {
		data = data || {};

		const attributes: ActivityAttributes = {
			status: data.status,
			accountId: this.model.get('accountId') as string, // Added accountId
			accountName: this.model.get('accountName') as string, // Added accountName
		};

		switch (this.model.entityType) {
			case 'User': {
				const model = this.model as UserModel;

				if (model.isPortal()) {
					attributes.usersIds = [model.id];
					const usersIdsNames: Record<string, string> = {};
					usersIdsNames[model.id] = model.get('name') as string;
					attributes.usersIdsNames = usersIdsNames;
				} else {
					attributes.assignedUserId = model.id;
					attributes.assignedUserName = model.get('name') as string;
				}
				break;
			}

			case 'Contact':
				if (this.model.get('accountId') && !this.getConfig().get('b2cMode')) {
					attributes.parentType = 'Account';
					attributes.parentId = this.model.get('accountId') as string;
					attributes.parentName = this.model.get('accountName') as string;
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
				attributes.parentName = this.model.get('name') as string;
				break;

			default:
				break;
		}

		if (this.model.entityType !== 'Account' && this.model.has('contactsIds')) {
			attributes.contactsIds = this.model.get('contactsIds') as string[];
			attributes.contactsNames = this.model.get('contactsNames') as Record<string, string>;
		}

		if (scope) {
			if (!attributes.parentId) {
				if (this.checkParentTypeAvailability(scope, this.model.entityType)) {
					attributes.parentType = this.model.entityType;
					attributes.parentId = this.model.id;
					attributes.parentName = this.model.get('name') as string;
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
