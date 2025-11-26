import type EntityManagerEditRecordView from 'espocrm/src/views/admin/entity-manager/record/edit';

type FieldView = {
	params: {
		translation?: string;
	};
	setupTranslation(): void;
	reRender(): void;
};

extend<EntityManagerEditRecordView>(Dep => class extends Dep {
	declare subjectEntityType: string;

	override setKanbanStatusIgnoreListTranslation(): void {
		const fieldView = this.getFieldView('kanbanStatusIgnoreList') as FieldView | null;

		if (!fieldView) {
			return;
		}

		const statusField = this.model.get('statusField') as string;

		const translation =
				(this.getMetadata().get(['entityDefs', this.subjectEntityType, 'fields', statusField, 'translation']) as string) ||
				this.subjectEntityType + '.options.' + statusField;

		fieldView.params.translation = translation;
		fieldView.setupTranslation();

		fieldView.reRender();
	}
});
