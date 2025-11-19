define(['views/modal', 'model'], (Dep, Model) => class extends Dep {
	override templateContent = '<div class="field" data-name="relatedField">{{{field}}}</div>';

	override backdrop = true;

	override setup() {
		this.header = this.translate('Select Related Field', 'labels', 'Workflow');

		const scope: any = this.options.scope;

		if (!scope) {
			throw new Error('Scope is not defined');
		}

		const model = new Model();

		this.createView(
			'field',
			'autocrm:views/admin/layouts/fields/select-related-attribute',
			{
				el: this.getSelector() + ' .field',
				model,
				enabledFields: this.options.enabledFields,
				scope: this.options.scope,
				mode: 'edit',
				name: 'selectedRelatedAttribute',
			},
			view => {
				this.listenTo(view, 'change', () => {
					const selectedRelatedAttribute = model.get('selectedRelatedAttribute');

					if (selectedRelatedAttribute) {
						this.trigger(
							'add-field',
							selectedRelatedAttribute,
							model.get('selectedRelatedAttributeTranslated'),
						);
					}
				});
			},
		);
	}
});
