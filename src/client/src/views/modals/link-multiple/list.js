define(['views/modal'], Dep => class extends Dep {
	cssName = 'modal-large';

	header = false;

	footer = false;

	template = 'viacrm:modals/link-multiple/list';

	setup() {
		super.setup();

		this.collection = this.options.collection;
		this.scope = this.options.scope || this.collection.name;
		this.header = this.translate(this.scope, 'scopeNames') || this.options.header || '';
		this.mode = this.options.mode;
		this.model = this.options.model;
		this.recordListLayout = this.options.recordListLayout;
	}

	afterRender() {
		super.afterRender();

		this.notify(this.translate(' ... '));

		this.createView('list', 'viacrm:views/fields/link-multiple/record-list', {
			collection: this.collection,
			layoutName: this.recordListLayoutSuperCompact,
			selector: '.recordList',
			checkboxes: false,
			rowActionsView: 'views/record/row-actions/view-and-edit',
			selectable: false,
		})
			.then(r => {
				r.render();
				this.notify(false);
			})
			.catch(err => {
				this.notify(false);
				console.error(err);
			});
	}
});
