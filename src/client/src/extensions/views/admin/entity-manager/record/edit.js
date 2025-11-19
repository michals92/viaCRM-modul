extend(Dep => class extends Dep {
	setKanbanStatusIgnoreListTranslation() {
		const fieldView = this.getFieldView('kanbanStatusIgnoreList');

		if (!fieldView) {
			return;
		}

		const statusField = this.model.get('statusField');

		const translation =
				this.getMetadata().get(['entityDefs', this.subjectEntityType, 'fields', statusField, 'translation']) ||
				this.subjectEntityType + '.options.' + statusField;

		fieldView.params.translation = translation;
		fieldView.setupTranslation();

		fieldView.reRender();
	}
});
