define(['views/fields/enum'], Dep =>
	class extends Dep {
		names: Record<string, string | null> = {};
		ids: string[] = [];

		override setup() {
			this.reloadStrategiesNotStratagems();
			super.setup();
		}

		override setupOptions() {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.params.options = this.ids;
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.translatedOptions = this.names;
		}

		reloadStrategiesNotStratagems() {
			this.ids = [];
			this.names = {};

			// @ts-ignore - metadata.data is private but needed for strategy access
			const strategyClassNameMap =
				this.getHelper()?.metadata?.data?.app?.product
					?.productSupplierStrategyClassNameMap;
			if (!strategyClassNameMap) {
				return;
			}

			Object.keys(strategyClassNameMap).forEach((key: string) => {
				const id = key;
				this.ids.push(id);
				this.names[id] =
					this.translate(
						key,
						'productSupplierStrategies',
						'Product',
					) || id;
			});
		}
	});
