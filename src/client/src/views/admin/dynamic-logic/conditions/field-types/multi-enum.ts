define(['views/admin/dynamic-logic/conditions/field-types/multi-enum'], Dep => class extends Dep {
	fetch() {
		var valueView = this.getView('value');

		var item = {
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
