define(['views/modal', 'model'], (Dep, Model) => class extends Dep {
	templateContent = `<div class="field" data-name="entityType">{{{entityType}}}</div>`;

	events = {
		'click a[data-action="addEntity"]': e => {
			this.trigger('add-field', $(e.currentTarget).data().name);
		},
	};

	setup() {
		this.header = this.translate('Add Entity', 'labels', 'Admin');
		this.scope = this.options.scope;

		const model = new Model();

		this.createView(
			'entityType',
			'autocrm:views/admin/conversions/modals/add-entity/fields/entity-type',
			{
				selector: '[data-name="entityType"]',
				model,
				mode: 'edit',
				scope: this.scope,
				defs: {
					name: 'entityType',
					params: {},
				},
			},
			view => {
				this.listenTo(view, 'change', () => {
					const list = model.get('entityType') || [];

					if (!list.length) {
						return;
					}

					this.trigger('add-entity-type', list[0]);
				});
			},
		);
	}
});
