define([], function () {
	const Handler = function (view) {
		this.view = view;
	};

	_.extend(Handler.prototype, {
		process () {
			const entityTypeList = this.view.getHelper().getAppParam('xmlTemplateEntityTypeList') || [];

			if (entityTypeList.includes(this.view.scope)) {
				this.view.dropdownItemList.push({
					label: 'Print to XML',
					name: 'printXml',
					data: {
						handler: 'autocrm:handlers/actions/print-xml',
					},
				});
			}
		}
	});

	_.extend(Handler.prototype, Backbone.Events);

	return Handler;
});
