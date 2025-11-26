import type ModelType from 'espocrm/src/model';

interface SearchManager {
	getWhere(): Record<string, unknown>;
}

interface AggregationData {
	[key: string]: unknown;
}

declare const $: JQueryStatic;

define(
	['model'],
	(Dep: typeof ModelType) => class extends Dep {
		aggregationData: AggregationData | null = null;

		searchManager: SearchManager | null = null;

		declare scope: string | null = null;

		setAggregationData(aggregationData: AggregationData): void {
			this.aggregationData = aggregationData;
		}

		setSearchManager(searchManager: SearchManager): void {
			this.searchManager = searchManager;
		}

		setScope(scope: string): void {
			this.scope = scope;
		}

		buildUrl(): string {
			return (
				'Aggregation/' +
				this.scope +
				'?' +
				$.param({
					select: Object.keys(this.aggregationData!).join(','),
					where: this.searchManager!.getWhere(),
				})
			);
		}

		override fetch(options?: Record<string, unknown>): void {
			if (!this.aggregationData || Object.keys(this.aggregationData).length === 0) {
				return;
			}

			this.url = this.buildUrl();

			super.fetch(options);
		}
	},
);
