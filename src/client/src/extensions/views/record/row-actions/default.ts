import type DefaultRowActionsView from 'espocrm/src/views/record/row-actions/default';
import type Model from 'espocrm/src/model';

interface ActionItem {
	action: string;
	label: string;
	data: {
		id: string;
	};
	handler: string;
	groupIndex: number;
}

extend<DefaultRowActionsView>(Dep => class extends Dep {
	declare model: Model;

	override getActionList(): ActionItem[] {
		const list = super.getActionList() as ActionItem[];

		if (
			this.getAcl().check(this.model.entityType, 'create') &&
			!this.getMetadata().get(['clientDefs', this.model.entityType, 'duplicateDisabled'])
		) {
			list.push({
				action: 'duplicate',
				label: 'Duplicate',
				data: {
					id: this.model.id,
				},
				handler: 'x',
				groupIndex: 0,
			});
		}

		return list;
	}
});
