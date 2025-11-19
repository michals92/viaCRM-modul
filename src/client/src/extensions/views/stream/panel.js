extend(Dep => class extends Dep {
	createCollection() {
		return this.getCollectionFactory().create('Note', collection => {
			this.collection = collection;

			collection.url = `${this.model.entityType}/${this.model.id}/stream`;
			collection.maxSize =
					this.getConfig().get('streamRecordsPerPage') || this.getConfig().get('recordsPerPageSmall') || 5;

			this.setFilter(this.filter);
		});
	}
});
