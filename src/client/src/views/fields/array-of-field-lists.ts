define(['viacrm:views/fields/array-of-arrays'], (Dep) => class extends Dep {
	setup() {
		super.setup();
		this.targetEntityType = this.options?.targetEntityType || this.params?.targetEntityType || this.targetEntityType;
	}

	/**
         * @private
         * @return {{value: string, text: string}[]}
         */
	getFieldDataList(): { value: string; text: string; }[] {
		const scope = this.targetEntityType;

		if (!scope) {
			return [];
		}

		const fields = this.getMetadata().get(['entityDefs', scope, 'fields']) || {};

		const forbiddenFieldList = this.getAcl().getScopeForbiddenFieldList(scope);

		const fieldList = Object.keys(fields)
			.sort((v1, v2) => this.translate(v1, 'fields', scope)
				.localeCompare(this.translate(v2, 'fields', scope)))
			.filter(item => {
				const defs = /** @type {Record} */fields[item];

				if (
					defs.disabled ||
                        defs.listLayoutDisabled ||
                        defs.utility
				) {
					return false;
				}

				const layoutAvailabilityList = defs.layoutAvailabilityList;

				if (layoutAvailabilityList && !layoutAvailabilityList.includes('list')) {
					return false;
				}

				const layoutIgnoreList = defs.layoutIgnoreList || [];

				if (layoutIgnoreList.includes('list')) {
					return false;
				}

				if (forbiddenFieldList.indexOf(item) !== -1) {
					return false;
				}

				return true;
			});

		const dataList: { value: string; text: string; }[] = [];

		fieldList.forEach(item => {
			dataList.push({
				value: item,
				text: this.translate(item, 'fields', scope) as string,
			});
		});

		return dataList;
	}
});