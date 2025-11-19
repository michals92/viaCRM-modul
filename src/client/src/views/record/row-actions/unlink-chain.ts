define(['views/base'], Dep => class extends Dep {
	override template = 'autocrm:record/row-actions/unlink-chain';

	override data() {
		return {
			modelId: this['model']!.id,
			noWrapper: this.options.noWrapper || false,
		};
	}
});
