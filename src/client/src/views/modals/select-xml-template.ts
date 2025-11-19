define(['views/modals/select-records'], Dep => class extends Dep {
	override multiple = false;
	override createButton = false;
	override searchPanel = false;
	override scope = 'XmlTemplate';

	override setupSearch() {
		this.filters = {
			entityType: {
				type: 'equals',
				value: this.options.entityType,
			},
		};

		super.setupSearch();
	}

	override afterRender() {
		super.afterRender();

		const firstLinkElement = this.$el.find('a.link').first().get(0);

		if (firstLinkElement) {
			setTimeout(() => firstLinkElement.focus({ preventScroll: true }), 10);
		}
	}
});
