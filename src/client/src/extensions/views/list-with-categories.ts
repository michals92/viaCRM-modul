import type ListWithCategoriesView from 'espocrm/src/views/list-with-categories';

type CategoryFilter = {
	attribute: string;
	type: string;
	value?: string | string[];
};

extend<ListWithCategoriesView>(Dep => class extends Dep {
	applyCategoryToCollection(): void {
		this.collection.whereFunction = (): CategoryFilter[] | undefined => {
			let filter: CategoryFilter | null | undefined;
			const isExpanded = this.isExpanded;

			// Backward compatibility
			const isCategoryMultiple = (): boolean => {
				if (typeof this.isCategoryMultiple === 'function') {
					return this.isCategoryMultiple();
				} else {
					return this.isCategoryMultiple as boolean;
				}
			};

			if (!isExpanded && !this.hasTextFilter()) {
				if (isCategoryMultiple()) {
					if (this.currentCategoryId) {
						filter = {
							attribute: this.categoryField,
							type: 'linkedWith',
							value: [this.currentCategoryId],
						};
					} else {
						filter = {
							attribute: this.categoryField,
							type: 'isNotLinked',
						};
					}
				} else {
					if (this.currentCategoryId) {
						filter = {
							attribute: this.categoryField + 'Id',
							type: 'equals',
							value: this.currentCategoryId,
						};
					} else {
						filter = null;
					}
				}
			} else {
				if (this.currentCategoryId) {
					filter = {
						attribute: this.categoryField,
						type: this.categoryFilterType,
						value: this.currentCategoryId,
					};
				}
			}

			if (filter) {
				return [filter];
			}

			return undefined;
		};
	}
});
