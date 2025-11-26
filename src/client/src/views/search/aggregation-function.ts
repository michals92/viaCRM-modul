define(['view'], Dep => class extends Dep {
	override template = 'viacrm:search/aggregation-function';

	override setup() {
		/** @type {module:viacrm:helpers/aggregation} */
		this.aggregationHelper = this.options.aggregationHelper;

		if (!this.aggregationHelper) {
			throw new Error('missing aggregationHelper');
		}

		this.entityType = this.options.entityType;
		this.name = this.options.name;
		this.function = this.options.function;
		this.field = this.options.field;

		const viewName = this.aggregationHelper.getFunctionViewName(this.field, this.function);

		this.createView('view', viewName, {
			model: this.model,
			el: this.options.el + ' .field',
			name: this.name,
			readOnly: true,
		});
	}

	override data() {
		return {
			name: this.name,
			function: this.function,
			field: this.field,
			scope: this.entityType,
		};
	}
});
