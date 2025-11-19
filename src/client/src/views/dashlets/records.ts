define(['views/dashlets/records'], Dep => class extends Dep {
	override getSearchData() {
		const searchData = super.getSearchData();

		const advancedFilters = this.getOption('advancedFilters');

		if (advancedFilters) {
			searchData.advanced = advancedFilters;
		}

		return searchData;
	}
});
