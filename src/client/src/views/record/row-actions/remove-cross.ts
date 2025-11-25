define(['views/base'], Dep => class extends Dep {
	override template = 'viacrm:record/row-actions/remove-cross';

	override data() {
		return {
			modelId: this.model?.id,
			noWrapper: this.options.noWrapper || false,
		};
	}
});
