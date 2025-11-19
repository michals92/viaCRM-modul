extend((Dep) => class extends Dep {
	getOptionDataList() {
		let list = super.getOptionDataList();

		if (this.params.hideUncheckedInView && !this.isEditMode() && !this.isSearchMode()) {
			list = list.filter(item => item.isChecked);
		}

		return list;
	}
});