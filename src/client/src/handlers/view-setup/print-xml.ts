interface DropdownItem {
	label: string;
	name: string;
	data: {
		handler: string;
	};
}

interface ViewWithDropdown {
	getHelper(): {
		getAppParam(key: string): string[] | undefined;
	};
	scope: string;
	dropdownItemList: DropdownItem[];
}

define(
	[],
	() => {
		const Handler = function (this: { view: ViewWithDropdown }, view: ViewWithDropdown): void {
			this.view = view;
		};

		_.extend(Handler.prototype, {
			process(this: { view: ViewWithDropdown }): void {
				const entityTypeList = this.view.getHelper().getAppParam('xmlTemplateEntityTypeList') || [];

				if (entityTypeList.includes(this.view.scope)) {
					this.view.dropdownItemList.push({
						label: 'Print to XML',
						name: 'printXml',
						data: {
							handler: 'viacrm:handlers/actions/print-xml',
						},
					});
				}
			},
		});

		_.extend(Handler.prototype, Backbone.Events);

		return Handler;
	},
);
