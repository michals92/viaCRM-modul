import type DetailView from 'espocrm/src/views/detail';
import type ActionHandler from 'espocrm/src/action-handler';
import type Model from 'espocrm/src/model';

define(['action-handler'], (Dep: typeof ActionHandler<DetailView>) => class extends Dep {
	actionPrintXml() {
		this.view.createView(
			'xmlTemplate',
			'autocrm:views/modals/select-xml-template',
			{
				entityType: this.view.model.name,
			},
			view => {
				view.render();

				this.view.listenToOnce(view, 'select', (model: Model) => {
					this.view.clearView('xmlTemplate');

					const url = $.param({
						entryPoint: 'xml',
						entityType: this.view.model.name,
						entityId: this.view.model.id,
						templateId: model.id,
					});

					window.open('?' + url, '_blank');
				});
			},
		);
	}
});
