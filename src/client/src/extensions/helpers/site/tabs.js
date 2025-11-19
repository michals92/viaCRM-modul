extend(Dep => class extends Dep {
	isTabGroup(item) {
		return super.isTabGroup(item) && item.type !== 'customLink';
	}
});
