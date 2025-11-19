import type ListWithCategoriesView from 'espocrm/src/views/list-with-categories';
import type ModalView from 'espocrm/src/views/modal';

define(['action-handler'], Dep => class extends Dep<ListWithCategoriesView> {
	init() {
		if (
			!this.view.getAcl().checkScope('DocumentFolder', 'create') ||
				!this.view.getAcl().checkScope('Document', 'create')
		) {
			this.view.hideHeaderActionItem('uploadFromZip');
		} else {
			this.view.showHeaderActionItem('uploadFromZip');
		}
	}

	async actionUploadFromZip() {
		const params: any = this.view.options.params;

		const modal = (await this.view.createView('modal', 'autocrm:views/modals/upload-zip', {
			categoryId: params.categoryId,
		})) as unknown as ModalView;

		modal.render();

		this.view.listenTo(modal, 'done', () => {
			Espo.Ui.success(this.view.translate('Done'));

			this.view.collection.fetch();

			const nestedCategoriesCollection = this.view.nestedCategoriesCollection;

			if (nestedCategoriesCollection) {
				nestedCategoriesCollection.fetch();
			}
		});
	}
});
