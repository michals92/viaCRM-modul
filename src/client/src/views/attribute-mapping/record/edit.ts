define(['views/record/edit-small'], Dep => class extends Dep {
	override template = 'viacrm:attribute-mapping/record/edit';

	override detailLayout = [
		{
			rows: [
				[
					{
						name: 'attributeMapping',
						view: 'viacrm:views/attribute-mapping/fields/attribute-mapping',
					},
				]
			],
			index: 0.5,
		},
	];
});
