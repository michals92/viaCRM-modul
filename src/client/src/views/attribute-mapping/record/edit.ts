define(['views/record/edit-small'], Dep => class extends Dep {
	override template = 'autocrm:attribute-mapping/record/edit';

	override detailLayout = [
		{
			rows: [
				[
					{
						name: 'attributeMapping',
						view: 'autocrm:views/attribute-mapping/fields/attribute-mapping',
					},
				]
			],
			index: 0.5,
		},
	];
});
