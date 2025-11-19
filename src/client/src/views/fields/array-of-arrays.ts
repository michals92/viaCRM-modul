define(['views/dashlets/fields/records/expanded-layout'], (Dep) => class extends Dep {
	type = 'arrayOfArrays';

	/**
         * @private
         * @return {{value: string, text: string}[]}
         */
	getFieldDataList(): { value: string; text: string; }[] {
		return [];
	}
});