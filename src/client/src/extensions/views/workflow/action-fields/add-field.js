extend(Dep => class extends Dep {
	template = 'autocrm:workflow/action-fields/add-field';

	events = {
		'click [data-action="addFieldModal"]': () => {
			this.createView(
				'modal',
				'autocrm:views/workflow/action-modals/add-field',
				{
					scope: this.options.scope,
				},
				view => {
					view.render();

					this.listenToOnce(view, 'add-field', field => {
						view.close();

						this.trigger('add-field', field);
					});
				},
			);
		},
	};
});
