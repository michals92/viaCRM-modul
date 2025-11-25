define(['views/base'], Dep => class extends Dep {
	override template = 'viacrm:record/row-actions/duplicate';

	override data() {
		return {
			modelId: this['model']!.id,
			noWrapper: this.options.noWrapper || false,
		};
	}
}); 
