// TODO: how did this get here and what is it for?
define(['views/layout-set/fields/layout-list', 'views/admin/layouts/index'], (Dep, LayoutsIndex) => class extends Dep {
	setupOptions() {
		this.params.options = [];
		this.translatedOptions = {};
		const scopes = this.getMetadata().get(['entityDefs', this.model.name, 'fields', this.name, 'entityTypeList']) || Object.keys(this.getMetadata().get('scopes'));
		const singleEntry = scopes.length === 1;
			
		this.scopeList = scopes
			.filter(item => this.getMetadata().get(['scopes', item, 'layouts']))
			.sort((v1, v2) => this.translate(v1, 'scopeNames')
				.localeCompare(this.translate(v2, 'scopeNames')));

		const dataList = LayoutsIndex.prototype.getLayoutScopeDataList.call(this);

		dataList.forEach(item1 => {
			const typeListForceList = this.getMetadata().get(['entityDefs', this.model.name, 'fields', this.name, 'typeList']) || [];
			item1.typeList.push(...typeListForceList);
			item1.typeList.forEach(type => {
				const item = item1.scope + '.' + type;

				if (type.endsWith('Portal')) {
					return;
				}

				this.params.options.push(item);
				if (singleEntry) {
					this.translatedOptions[item] = this.translate(type, 'layouts', 'Admin');
				} else {
					this.translatedOptions[item] = this.translate(item1.scope, 'scopeNames') + ' . ' +
							this.translate(type, 'layouts', 'Admin');
				}
			});
		});
	}
});
