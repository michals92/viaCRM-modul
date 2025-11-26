import type StreamPanelView from 'espocrm/src/views/stream/panel';
import type Collection from 'espocrm/src/collection';
import type Model from 'espocrm/src/model';

extend<StreamPanelView>(Dep => class extends Dep {
	declare collection: Collection & { url: string; maxSize: number };
	declare model: Model;
	declare filter: string;

	override createCollection(): Promise<void> {
		return this.getCollectionFactory().create('Note', (collection: Collection & { url: string; maxSize: number }) => {
			this.collection = collection;

			collection.url = `${this.model.entityType}/${this.model.id}/stream`;
			collection.maxSize =
				(this.getConfig().get('streamRecordsPerPage') as number) || (this.getConfig().get('recordsPerPageSmall') as number) || 5;

			this.setFilter(this.filter);
		});
	}
});
