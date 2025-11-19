define(['views/record/detail'], Dep => class extends Dep {
	override template = 'autocrm:abstract/record/compare';

	override layoutName = 'attachmentCompare';

	override setupFinal() {
		super.setupFinal();

		// @ts-ignore oof, private property
		const el = this.getSelector() || '#' + this.id;

		// Get the attachment field from clientDefs
		const attachmentField = this.getMetadata().get(['clientDefs', this.model.entityType as string, 'attachmentCompareViewModeField']) || 'attachments';

		this.createView(
			'attachments',
			'autocrm:views/abstract/record/attachments',
			{
				model: this.model,
				fullSelector: el + ' .attachments',
				attachmentField: attachmentField
			},
		);
	}
});
