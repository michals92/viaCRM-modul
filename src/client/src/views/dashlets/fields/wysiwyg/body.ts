define(['views/fields/wysiwyg'], Dep => class extends Dep {
	override setup() {
		super.setup();

		// This is needed so that files can be saved
		this.model.entityType = 'Template';
	}
});
