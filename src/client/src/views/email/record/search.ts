define(['views/record/search'], Dep => class extends Dep {
	override setup() {
		this.viewModeIconClassMap.combined = 'fas fa-book-open';

		super.setup();
	}
});
