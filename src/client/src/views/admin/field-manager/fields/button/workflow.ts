define(['views/fields/link'], Dep => class extends Dep {
	getSelectFilters() {
		return {
			type: {
				type: 'in',
				value: ['manual'],
				data: { type: 'anyOf', valueList: ['manual'] },
			},
		};
	}
});
