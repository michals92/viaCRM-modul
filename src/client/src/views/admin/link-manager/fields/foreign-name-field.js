define(['views/fields/enum'], Dep => class extends Dep {
	setup() {
		super.setup();
	}

	setupOptions() {
		// Get the link name from props
		const link = this.options.link;
		const entityType = this.options.entityType;

		// Get the foreign entity that this link points to
		const foreignScope = this.getMetadata().get(['entityDefs', entityType, 'links', link, 'entity']);

		if (!foreignScope) {
			this.params.options = [''];
			return;
		}

		// Get all varchar fields from the foreign entity
		const fields = this.getFieldManager().getEntityTypeFieldList(foreignScope, {
			typeList: ['varchar'],
		});

		// Add empty option at the beginning
		fields.unshift('');

		this.params.options = fields;
		this.params.translation = `${foreignScope}.fields`;
	}
});
