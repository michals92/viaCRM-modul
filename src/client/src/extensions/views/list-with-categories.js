extend(Dep => class extends Dep {
	applyCategoryToCollection() {
		this.collection.whereFunction = () => {
			let filter;
			const isExpanded = this.isExpanded;

			// Backward compatibility
			const isCategoryMultiple = () => {
				if (typeof this.isCategoryMultiple === 'function') {
					return this.isCategoryMultiple();
				} else {
					return this.isCategoryMultiple;
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
		};
	}
});
