define(['acl'], Dep => class extends Dep {
	checkIsOwner(model) {
		return this.getUser().id === model.id;
	}
});