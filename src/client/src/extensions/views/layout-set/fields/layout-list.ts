// Note: This file uses `define()` instead of `extend()` because it's a standalone view, not an extension.
import type LayoutListFieldView from 'espocrm/src/views/layout-set/fields/layout-list';
import type LayoutsIndexView from 'espocrm/src/views/admin/layouts/index';
import type Model from 'espocrm/src/model';

interface LayoutScopeDataItem {
	scope: string;
	typeList: string[];
}

define(
	['views/layout-set/fields/layout-list', 'views/admin/layouts/index'],
	(Dep: typeof LayoutListFieldView, LayoutsIndex: typeof LayoutsIndexView) => class extends Dep {
		declare scopeList: string[];
		model!: Model;
		name!: string;
		params!: { options: string[] };
		declare translatedOptions: Record<string, string>;

		override setupOptions(): void {
			this.params.options = [];
			this.translatedOptions = {};
			const scopes = (this.getMetadata().get(['entityDefs', this.model.name, 'fields', this.name, 'entityTypeList']) as string[]) || Object.keys(this.getMetadata().get('scopes') as Record<string, unknown>);
			const singleEntry = scopes.length === 1;

			this.scopeList = scopes
				.filter((item: string) => this.getMetadata().get(['scopes', item, 'layouts']))
				.sort((v1: string, v2: string) => (this.translate(v1, 'scopeNames') as string)
					.localeCompare(this.translate(v2, 'scopeNames') as string));

			const dataList = LayoutsIndex.prototype.getLayoutScopeDataList.call(this) as LayoutScopeDataItem[];

			dataList.forEach((item1: LayoutScopeDataItem) => {
				const typeListForceList = (this.getMetadata().get(['entityDefs', this.model.name, 'fields', this.name, 'typeList']) as string[]) || [];
				item1.typeList.push(...typeListForceList);
				item1.typeList.forEach((type: string) => {
					const item = item1.scope + '.' + type;

					if (type.endsWith('Portal')) {
						return;
					}

					this.params.options.push(item);
					if (singleEntry) {
						this.translatedOptions[item] = this.translate(type, 'layouts', 'Admin') as string;
					} else {
						this.translatedOptions[item] = (this.translate(item1.scope, 'scopeNames') as string) + ' . ' +
							(this.translate(type, 'layouts', 'Admin') as string);
					}
				});
			});
		}
	},
);
