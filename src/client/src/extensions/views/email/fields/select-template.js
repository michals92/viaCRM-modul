extend(Dep => class extends Dep {
	getSelectFilters() {
		return this.getMetadata().get(['clientDefs', 'EmailTemplate', 'defaultSelectFilters'], null);
	}
});
