import type KanbanRecordView from 'espocrm/src/views/record/kanban';

interface GroupDataItem {
	name: string;
	iconClass?: string | null;
	color?: string;
	[key: string]: unknown;
}

interface RawGroupDataItem {
	color?: string;
	[key: string]: unknown;
}

extend<KanbanRecordView>(Dep => class extends Dep {
	override template = 'viacrm:record/kanban';

	override buildRows(callback?: () => void): void {
		super.buildRows(() => {
			(this.groupDataList as GroupDataItem[]).forEach((item, i) => {
				const iconClass =
						item.iconClass ||
						this.getMetadata().get(
							['entityDefs', this.scope, 'fields', this.statusField, 'icons', item.name],
							null,
						);

				item.iconClass = iconClass;
				item.color = (this.groupRawDataList as RawGroupDataItem[])[i].color;
			});

			if (callback) {
				callback();
			}
		});
	}
});
