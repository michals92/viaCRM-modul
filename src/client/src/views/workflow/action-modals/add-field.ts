define(['views/modal', 'model'], (Dep, Model) => class extends Dep {
	override templateContent = `<div class="field" data-name="field">{{{field}}}</div>`;

	override events = {
		'click a[data-action="addField"]': e => {
			this.trigger('add-field', $(e.currentTarget).data().name);
		},
	};

	override setup() {
		this.header = this.translate('Add Field');
		this.scope = this.options.scope as string;

		const model = new Model();

		this.createView(
			'field',
			'autocrm:views/workflow/action-modals/add-field/fields/field',
			{
				selector: '[data-name="field"]',
				model,
				mode: 'edit',
				scope: this.scope,
				defs: {
					name: 'field',
					params: {},
				},
			},
			view => {
				this.listenTo(view, 'change', () => {
					const list = model.get<string[]>('field') || [];

					if (!list.length) {
						return;
					}

					this.trigger('add-field', list[0]);
				});
			},
		);
	}
});
