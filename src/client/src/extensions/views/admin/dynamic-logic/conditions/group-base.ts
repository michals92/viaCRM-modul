import type DynamicLogicConditionFieldTypeBaseView from 'espocrm/src/views/admin/dynamic-logic/conditions/group-base';

type ItemData = {
	attribute?: string;
	type?: string;
	data?: {
		type?: string;
		field?: string;
	};
	subjectType?: string;
	value?: unknown[];
};

type ViewDataItem = {
	key: string;
};

type ConditionView = {
	fetch(): ItemData;
	render(): void;
};

extend<DynamicLogicConditionFieldTypeBaseView>(Dep => class extends Dep {
	operator!: string;
	viewDataList!: ViewDataItem[];
	viewList!: string[];
	declare scope: string;
	level!: number;
	isCurrentUser!: boolean;

	override fetch(): ItemData {
		const list: ItemData[] = [];

		this.viewDataList.forEach((item: ViewDataItem) => {
			const view = this.getView(item.key) as ConditionView | undefined;

			// This is the difference from the parent. This will result in not existing attributes being skipped (because the view for the isn't created)
			if (view) {
				list.push(view.fetch());
			}
		});

		return {
			type: this.operator,
			value: list,
		};
	}

	createItemView(number: number, key: string, item: ItemData): void {
		this.viewList.push(key);

		this.isCurrentUser = !!(item.attribute && item.attribute.startsWith('$user.'));

		const scope = this.isCurrentUser ? 'User' : this.scope;

		item = item || {};

		const additionalData = item.data || {};

		const type = additionalData.type || item.type || 'equals';
		const field = additionalData.field || item.attribute;
		// Ensuring the item is rendered even if the field is deleted.
		let viewName = 'views/admin/dynamic-logic/conditions/field-types/base';
		let fieldType: string | undefined;

		if (['and', 'or', 'not'].includes(type)) {
			viewName = 'views/admin/dynamic-logic/conditions/' + type;
		} else {
			fieldType = this.getMetadata().get(['entityDefs', scope, 'fields', field, 'type']) as string | undefined;

			if (field === 'id') {
				fieldType = 'id';
			}

			if (item.attribute === '$user.id') {
				fieldType = 'currentUser';
			}

			if (item.attribute === '$user.teamsIds') {
				fieldType = 'currentUserTeams';
			}

			if (item.attribute === '$user.rolesIds') {
				fieldType = 'currentUserRoles';
			}

			if (fieldType) {
				viewName = this.getMetadata().get(['clientDefs', 'DynamicLogic', 'fieldTypes', fieldType, 'view']) as string;
			}
		}

		this.createView(
			key,
			viewName,
			{
				itemData: item,
				scope: scope,
				level: this.level + 1,
				selector: '[data-view-key="' + key + '"]',
				number: number,
				type,
				field,
				fieldType,
				subjectType: item.subjectType || 'value',
				parentScope: this.scope,
			},
			(view: ConditionView) => {
				if (this.isRendered()) {
					view.render();
				}

				this.controlAddItemVisibility();

				this.listenToOnce(view, 'remove-item', () => {
					this.removeItem(number);
				});
			},
		);
	}

	addCurrentUserRoles(): void {
		const i = this.getIndexForNewItem();
		const key = this.getKey(i);

		this.addItemContainer(i);
		this.addViewDataListItem(i, key);

		this.createItemView(i, key, {
			attribute: '$user.rolesIds',
			data: {
				type: 'contains',
				field: 'roles',
			},
		});
	}
});
