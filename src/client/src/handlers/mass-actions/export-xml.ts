import type ListRecordView from 'espocrm/src/views/record/list';

define([], () => class {
	view: ListRecordView;
		
	constructor(view: ListRecordView) {
		this.view = view;
	}

	checkVisibility() {
		const xmlTemplateEntityTypeList = this.view.getHelper().getAppParam<string[]>('xmlTemplateEntityTypeList') || [];

		if (this.view.collection.name) {
			return xmlTemplateEntityTypeList.includes(
				this.view.collection.name,
			);				
		} else {
			return false;
		}
	}

	actionExportXml(data) {
		const idList = data.params.ids;

		this.view.createView(
			'xmlTemplate',
			'viacrm:views/modals/select-xml-template',
			{
				entityType: this.view.collection.name,
			},
			view => {
				view.render();

				this.view.listenToOnce(view, 'select', templateModel => {
					this.view.clearView('xmlTemplate');

					Espo.Ui.notifyWait();

					Espo.Ajax.postRequest(
						'Xml/action/massExport',
						{
							idList: idList,
							entityType: this.view.collection.name,
							templateId: templateModel.id,
						},
						{ timeout: 0 },
					).then(result => {
						Espo.Ui.notify(false);

						window.open('?entryPoint=download&id=' + result.id, '_blank');
					});
				});
			},
		);
	}
});
