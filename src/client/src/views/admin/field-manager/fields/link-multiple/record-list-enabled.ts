define(['views/fields/bool'], Dep => class extends Dep {
	recordListFields = [
		'recordListLayout',
		'recordListCreateDisabled',
		'recordListLinkDisabled',
		'recordListRemoveDisabled',
		'recordListKeepRemoved',
		'recordListOrderByField',
	];

	override setup() {
		super.setup();

		this.listenTo(this.model, 'change:recordListEnabled', this.manageRecordListFieldsVisibility);
	}

	override afterRender() {
		super.afterRender();

		this.manageRecordListFieldsVisibility();
	}

	manageRecordListFieldsVisibility() {
		const func = this.model.get('recordListEnabled') ? 'showField' : 'hideField';

		const parentView = this.getParentView();

		if (parentView) {
			this.recordListFields.forEach(field => {
				parentView[func](field);
			});
		}
	}
});
