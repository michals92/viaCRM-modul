import type LinkMultipleFieldView from 'espocrm/src/views/fields/link-multiple';
import type Model from 'espocrm/src/model';
import type Collection from 'espocrm/src/collection';
import type { ForeignMultipleFieldData } from 'viacrm/types';

interface ForeignItem {
	id?: string;
	[key: string]: unknown;
}

define(
	['views/fields/link-multiple'],
	(Dep: typeof LinkMultipleFieldView) => class extends Dep {
		override type = 'foreignMultiple';

		override listTemplate = 'viacrm:fields/foreign-multiple/list';
		override detailTemplate = 'viacrm:fields/foreign-multiple/detail';
		override searchTemplate = 'viacrm:fields/foreign-multiple/search';

		declare collection: ForeignItem[] | null = null;

		styleMap: Record<string, string> = {};
		displayAsLabel = false;
		displayAsList = false;
		displayAsLinks = false;

		declare foreignScope: string;
		declare nameHashName: string;
		declare idsName: string;
		fieldName?: string;
		fieldLink?: string;
		linkEntity?: string;
		linkForeign?: string;
		declare model: Model;
		declare name: string;
		declare params: {
			displayAsLabel?: boolean;
			displayAsList?: boolean;
			displayAsLinks?: boolean;
			styleMap?: Record<string, string>;
		};

		override data(): ForeignMultipleFieldData {
			return {
				...super.data(),
				isEmpty: this.collection ? this.collection.length === 0 : true,
				searchWarning: this.translate('foreignMultipleSearchWarning', 'messages') as string,
			};
		}

		getItemLink(item: ForeignItem): JQuery {
			const id = item['id'] || null;
			const entity = this.getLinkEntity();
			const value = item[this.getFieldName()] as string || null;

			return $('<a>').attr('href', `#${entity}/view/${id}`).attr('data-id', id!).attr('title', value!).text(value!);
		}

		getItemHtml(item: ForeignItem): string {
			const value = item[this.getFieldName()] as string || null;

			const style = this.styleMap[item as unknown as string] || 'default';

			if (this.displayAsLabel) {
				const $span = $('<span>').addClass('label label-md label-' + style);

				if (this.displayAsLinks) {
					$span.append(this.getItemLink(item));
				} else {
					$span.text(value!);
				}

				return $span.get(0)!.outerHTML;
			}

			if (style && style !== 'default') {
				const $span = $('<span>').addClass('text-' + style);

				if (this.displayAsLinks) {
					$span.append(this.getItemLink(item));
				} else {
					$span.text(value!);
				}

				return $span.get(0)!.outerHTML;
			}

			const $span = $('<span>');

			if (this.displayAsLinks) {
				$span.append(this.getItemLink(item));
			} else {
				$span.text(value!);
			}

			return $span.get(0)!.outerHTML;
		}

		override getValueForDisplay(): string | null {
			if (this.collection === null) return null;

			const items = this.collection.map(item => this.getItemHtml(item));

			if (this.displayAsList) {
				if (!items.length) {
					return '';
				}

				let itemClassName = 'foreign-multiple-enum-item-container';

				if (this.displayAsLabel) {
					itemClassName += ' foreign-multiple-item-label-container';
				}

				return items.map(item => $('<div>').addClass(itemClassName).html(item).get(0)!.outerHTML).join('');
			}

			if (this.displayAsLabel) {
				return items.join(' ');
			}

			return items.join(', ');
		}

		async loadCollection(): Promise<void> {
			const collection = await this.getCollectionFactory().create(this.foreignScope) as Collection & {
				fetch(options?: { where?: unknown[] }): Promise<{ list: ForeignItem[] }>;
			};
			const where: unknown[] = [];

			const linkForeign = this.getLinkForeign();

			if (this.hasLinkRelationName()) {
				if (linkForeign) {
					where.push({
						type: 'linkedWith',
						attribute: linkForeign,
						value: [this.model.get('id')],
					});
				} else {
					let ids = this.model.get(this.idsName) as string[];

					if (ids.length === 0) {
						ids = ['some-not-making-sense-junk'];
					}

					where.push({
						type: 'in',
						attribute: 'id',
						value: ids,
					});
				}
			} else {
				where.push({
					type: 'equals',
					attribute: this.getLinkForeign() + 'Id',
					value: this.model.get('id'),
				});
			}

			const result = await collection.fetch({where});

			this.collection = result.list.filter(x => this.getFieldName() in x);
		}

		override async prepare(): Promise<ForeignItem[] | void> {
			if (this.collection) {
				return this.collection;
			}

			if (this.isListMode()) {
				void this.loadCollection().then(() => this.reRender());
				return;
			}

			await this.loadCollection();
		}

		hasLinkRelationName(): boolean {
			const link = this.model.getFieldParam(this.name, 'link') as string;
			return this.model.getLinkParam(link, 'relationName') !== null;
		}

		getFieldName(): string {
			return this.fieldName || this.model.getFieldParam(this.name, 'field') as string;
		}

		getFieldLink(): string {
			return this.fieldLink || this.model.getFieldParam(this.name, 'link') as string;
		}

		getLinkEntity(): string {
			const link = this.getFieldLink();
			return this.linkEntity || this.model.getLinkParam(link, 'entity') as string;
		}

		getLinkForeign(): string {
			const link = this.getFieldLink();
			return this.linkForeign || this.model.getLinkParam(link, 'foreign') as string;
		}

		override setup(): void {
			super.setup();

			this.nameHashName = this.getFieldLink() + 'Names';
			this.idsName = this.getFieldLink() + 'Ids';
			this.foreignScope = this.getLinkEntity();

			this.displayAsLabel = this.params.displayAsLabel || this.displayAsLabel;
			this.displayAsList = this.params.displayAsList || this.displayAsList;
			this.displayAsLinks = this.params.displayAsLinks || this.displayAsLinks;
			this.styleMap = this.params.styleMap || this.styleMap;
		}
	},
);
