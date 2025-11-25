define(['viacrm:views/fields/advanced-filters', 'viacrm:helpers/version'], (Dep, VersionHelper) => class extends Dep {
	detailTemplateContent = "{{translate 'displayableOnlyInEditMode' category='messages'}}";

	setup() {
		this.entityType = this.model.get('entityType');

		this.wait(this.getCollectionFactory().create('XmlFeed', collection => {
			this.searchManager = (new VersionHelper(this.getConfig()))
				.createSearchManager(collection, null, null, this.getDateTime(), {});
		}));

		super.setup();
	}

	fetch() {
		const data = super.fetch();

		const filters = data[this.name];

		this.searchManager.setAdvanced(filters);

		data[this.name + 'Processed'] = this.searchManager.getWhere();

		return data;
	}
});
