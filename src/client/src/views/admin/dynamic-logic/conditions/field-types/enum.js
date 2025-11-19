define(['views/admin/dynamic-logic/conditions/field-types/enum'], Dep => class extends Dep {
	fetch() {
		const valueView = this.getView('value');

		const item = {
			type: this.type,
			subjectType: this.subjectType,
			attribute: this.field,
		};

		if (valueView) {
			valueView.fetchToModel();
			item.value = this.model.get(this.field);
		}

		return item;
	}
});
