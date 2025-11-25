define(['views/base'], Dep => class extends Dep {
	override template = 'viacrm:record/row-actions/sort-magnet';

	override data() {
		return {
			noWrapper: this.options.noWrapper || false,
		};
	}
});
