define(['view'], Dep => class extends Dep {
	override template = 'autocrm:admin/conversions/fields/attribute-mapping';

	declare events = {
		'click [data-action="editAttributeMap"]': () => {
			this.createView(
				'modal',
				'autocrm:views/admin/conversions/modals/edit-attribute-mapping',
				{
					conditionGroup: this.conditionGroup,
					scope: 'AttributeMapping',
					model: this.model,
				},
				view => {
					view.render();

					this.listenTo(view, 'apply', conditionGroup => {
						this.conditionGroup = conditionGroup;

						this.trigger('change');

						this.createStringView();
					});
				},
			);
		},
	};

	override setup() {
		this.scope = this.options.scope;
		this.model = this.options.model;
	}
});
