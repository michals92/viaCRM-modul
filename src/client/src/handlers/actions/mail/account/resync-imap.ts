import type DetailView from 'espocrm/src/views/detail';

define(['action-handler'], Dep => class extends Dep<DetailView> {
	async massAction(data) {
		await this.actionResyncImap(data?.params?.ids);
	}

	async actionResyncImap(ids: unknown = null) {
		const endpointName = this.view.scope === 'EmailAccount' ? 'PersonalAccount' : 'GroupAccount';

		if (!Array.isArray(ids) || !ids.every(item => typeof item === 'string')) {
			const modelId: string = this.view.model.id as string;

			if (!modelId) {
				throw new Error('Invalid model id: modelId is required');
			}

			ids = [modelId];
		}

		return this.view.createView('modal', 'viacrm:views/abstract/modal/hour-selector', {
			headerText: this.view.translate('Resync Imap', 'labels', 'Email'),
			endpointName,
			ids
		}, view => {
			view.render();
		});
	}

	isVisible(): boolean {
		const isAdmin = this?.view?.getUser()?.isAdmin() || false;
		const useImap = this?.view?.model?.get('useImap') ?? false;

		return isAdmin && useImap;
	}
});