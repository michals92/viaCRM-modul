import type RecordEditView from 'espocrm/src/views/record/edit';

define(['views/fields/bool'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.wait(true);

		const scope = this.model.scope;

		if (!scope) {
			throw new Error('Entity type is not defined');
		}

		const name = this.model.get<string>('name');

		if (!name) {
			return;
		}

		this.getModelFactory().create(scope, model => {
			const linkType = model.getLinkType(name);

			if (linkType === 'manyToMany') {
				const parentView = this.getParentView<RecordEditView>();

				if (parentView) {
					parentView.hideField('recordListKeepRemoved');
				}
			}

			this.wait(false);
		});
	}
});
