define(['views/list'], Dep => class extends Dep {
	override keepCurrentRootUrl = true;

	override setup() {
		super.setup();

		const params: Record<string, any> = this.options.params = this.options.params || {};

		if (params.entityType) {
			this.collection.where = [
				{
					type: 'equals',
					attribute: 'entityType',
					value: params.entityType,
				},
			];
		}
	}
});