define(['model'], Dep => class extends Dep {
	aggregationData = null;

	searchManager = null;

	scope = null;

	setAggregationData(aggregationData) {
		this.aggregationData = aggregationData;
	}

	setSearchManager(searchManager) {
		this.searchManager = searchManager;
	}

	setScope(scope) {
		this.scope = scope;
	}

	buildUrl() {
		return (
			'Aggregation/' +
				this.scope +
				'?' +
				$.param({
					select: Object.keys(this.aggregationData).join(','),
					where: this.searchManager.getWhere(),
				})
		);
	}

	fetch(options) {
		if (Object.keys(this.aggregationData).length === 0) {
			return;
		}

		this.url = this.buildUrl();

		super.fetch(options);
	}
});
