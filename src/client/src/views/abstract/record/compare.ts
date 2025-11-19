define(['views/record/detail'], Dep => class extends Dep {
	override template = 'autocrm:abstract/record/compare';

	override layoutName = 'compare';

	override setupFinal() {
		super.setupFinal();

		// @ts-ignore oof, private property
		const el = this.getSelector() || '#' + this.id;

		this.createView(
			'attachments',
			'autocrm:views/abstract/record/attachments',
			{model: this.model, fullSelector: el + ' .attachments'},
		);
	}
});
