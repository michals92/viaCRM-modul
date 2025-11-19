extend(Dep => class extends Dep {
	getActionList() {
		return [...super.getActionList(), 'print'];
	}
});