define(['views/fields/entity-type-list'], Dep => class extends Dep {
	setupOptions() {
		super.setupOptions();

		const metadata = this.getMetadata();

		this.params.options = this.params.options.filter(scope => {
			const scopeData = metadata.get(['scopes', scope], {});

			return (scopeData.completedStatusList || []).length > 0 && scopeData.statusField;
		});
	}
});
