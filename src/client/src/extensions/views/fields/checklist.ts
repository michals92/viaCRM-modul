import type ChecklistFieldView from 'espocrm/src/views/fields/checklist';

interface OptionDataItem {
	isChecked: boolean;
	[key: string]: unknown;
}

extend<ChecklistFieldView>((Dep) => class extends Dep {
	override getOptionDataList(): OptionDataItem[] {
		let list: OptionDataItem[] = super.getOptionDataList();

		if (this.params.hideUncheckedInView && !this.isEditMode() && !this.isSearchMode()) {
			list = list.filter(item => item.isChecked);
		}

		return list;
	}
});
