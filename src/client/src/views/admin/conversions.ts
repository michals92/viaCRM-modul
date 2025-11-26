define(['views/main', 'model'], (Dep, Model) => class extends Dep {
	override template = 'autocrm:admin/conversions';

	override setup() {
		this.scope = this.options.scope;

		this.conversionData = this.getConversionData();

		let i = 0;
		this.counter = i;

		for (const foreignScope in this.conversionData) {
			const scopeData = this.conversionData[foreignScope];

			const model = new Model();

			model.name = model.entityType = 'AttributeMapping';

			model.set({
				scope: this.scope,
				foreignScope,
				actionData: {
					fieldList: scopeData.fieldList || [],
					fields: scopeData.fields || {},
				},
			});

			this.createView(foreignScope, 'autocrm:views/admin/conversions/fields/attribute-mapping', {
				el: this.options.el + ' [data-name="attribute-mapping-' + i + '"]',
				model,
				scope: this.scope,
				foreignScope,
			});

			i++;
		}
		this.counter = i;
	}

	declare events = {
		'click [data-action="addEntity"]': () => {
			this.createView(
				'addEntity',
				'autocrm:views/admin/conversions/modals/add-entity',
				{
					scope: this.scope,
				},
				view => {
					view.render();

					this.listenTo(view, 'add-entity-type', foreignScope => {
						view.close();

						// Create a new model for the attribute mapping
						const model = new Model();
						model.name = model.entityType = 'AttributeMapping';
						model.defs = {
							links: {},
						};
						model.set({
							scope: this.scope,
							foreignScope,
							actionData: {
								fieldList: [],
								fields: {},
							},
						});

						// Define the new index
						const newIndex = this.counter;

						// Create the new table row using jQuery
						const newRow = $('<tr></tr>');
						newRow.append(`<td>${foreignScope}</td>`);
						const $attributeMappingDiv = $(`<div data-name='attribute-mapping-${newIndex}'></div>`);
						newRow.append($('<td></td>').append($attributeMappingDiv));

						// Append the new row to the table body
						this.$el.find('table tbody').append(newRow);

						// Create the attribute-mapping view on the new element
						this.createView(
							foreignScope,
							'autocrm:views/admin/conversions/fields/attribute-mapping',
							{
								el: this.options.el + ' [data-name="attribute-mapping-' + newIndex + '"]',
								model,
								scope: this.scope,
								foreignScope,
							},
							view => {
								view.render();
							},
						);

						// Increment the counter for the next addition
						this.counter++;
					});
				},
			);
		},
	};

	override data() {
		return {
			scope: this.scope,
			conversionData: this.conversionData,
		};
	}

	getConversionData() {
		return this.getMetadata().get(['conversionDefs', this.scope]) || {};
	}
});
