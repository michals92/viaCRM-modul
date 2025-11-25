define(['views/fields/link'], Dep =>
	class extends Dep {
		getSelectFilters() {
			let filters = {};

			const productId = <string>this.model.get('productId');
			const productName = this.model.get('productName');

			if (productId) {
				// Create nameHash object directly with the property
				const nameHash = {};
				nameHash[productId] = productName;

				filters = {
					products: {
						type: 'linkedWith',
						value: [productId],
						data: {
							type: 'anyOf',
							nameHash,
						},
					},
				};
			}

			return filters;
		}
	});
