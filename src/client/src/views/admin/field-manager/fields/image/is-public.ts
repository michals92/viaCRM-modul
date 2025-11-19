define(['views/fields/bool'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.listenTo(this.model, 'change:isPublic', this.managePublicDownloadTokenVisibility);
	}

	override afterRender() {
		super.afterRender();

		this.managePublicDownloadTokenVisibility();
	}

	managePublicDownloadTokenVisibility() {
		const isPublic = this.model.get('isPublic');

		const func = isPublic ? 'showField' : 'hideField';

		const parentView = this.getParentView();

		if (parentView) {
			if (isPublic && !this.model.get('publicDownloadToken')) {
				this.model.set('publicDownloadToken', crypto.randomUUID());
			}

			parentView[func]('publicDownloadToken');
		}
	}
});
