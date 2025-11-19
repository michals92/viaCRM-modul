define(['views/fields/link-multiple'], Dep => class extends Dep {
	type = 'foreignMultiple';

	listTemplate = 'autocrm:fields/foreign-multiple/list';
	detailTemplate = 'autocrm:fields/foreign-multiple/detail';
	searchTemplate = 'autocrm:fields/foreign-multiple/search';

	collection = null;

	styleMap = {};
	displayAsLabel = false;
	displayAsList = false;
	displayAsLinks = false;

	data() {
		return {
			...super.data(),
			isEmpty: this.collection ? this.collection.length === 0 : true,
			searchWarning: this.translate('foreignMultipleSearchWarning', 'messages'),
		};
	}

	getItemLink(item) {
		const id = item['id'] || null;
		const entity = this.getLinkEntity();
		const value = item[this.getFieldName()] || null;

		return $('<a>').attr('href', `#${entity}/view/${id}`).attr('data-id', id).attr('title', value).text(value);
	}

	getItemHtml(item) {
		const value = item[this.getFieldName()] || null;

		const style = this.styleMap[item] || 'default';

		if (this.displayAsLabel) {
			const $span = $('<span>').addClass('label label-md label-' + style);

			if (this.displayAsLinks) {
				$span.append(this.getItemLink(item));
			} else {
				$span.text(value);
			}

			return $span.get(0).outerHTML;
		}

		if (style && style !== 'default') {
			const $span = $('<span>').addClass('text-' + style);

			if (this.displayAsLinks) {
				$span.append(this.getItemLink(item));
			} else {
				$span.text(value);
			}

			return $span.get(0).outerHTML;
		}

		const $span = $('<span>');

		if (this.displayAsLinks) {
			$span.append(this.getItemLink(item));
		} else {
			$span.text(value);
		}

		return $span.get(0).outerHTML;
	}

	getValueForDisplay() {
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

			return items.map(item => $('<div>').addClass(itemClassName).html(item).get(0).outerHTML).join('');
		}

		if (this.displayAsLabel) {
			return items.join(' ');
		}

		return items.join(', ');
	}

	async loadCollection() {
		const collection = await this.getCollectionFactory().create(this.foreignScope);
		const where = [];

		const linkForeign = this.getLinkForeign();

		if (this.hasLinkRelationName()) {
			if (linkForeign) {
				where.push({
					type: 'linkedWith',
					attribute: linkForeign,
					value: [this.model.get('id')],
				});
			} else {
				let ids = this.model.get(this.idsName);

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

		const result = await collection.fetch({ where });

		this.collection = result.list.filter(x => this.getFieldName() in x);
	}

	async prepare() {
		if (this.collection) {
			return this.collection;
		}

		if (this.isListMode()) {
			void this.loadCollection().then(() => this.reRender());
			return;
		}

		await this.loadCollection();
	}

	hasLinkRelationName() {
		const link = this.model.getFieldParam(this.name, 'link');
		return this.model.getLinkParam(link, 'relationName') !== null;
	}

	getFieldName() {
		return this.fieldName || this.model.getFieldParam(this.name, 'field');
	}

	getFieldLink() {
		return this.fieldLink || this.model.getFieldParam(this.name, 'link');
	}

	getLinkEntity() {
		const link = this.getFieldLink();
		return this.linkEntity || this.model.getLinkParam(link, 'entity');
	}

	getLinkForeign() {
		const link = this.getFieldLink();
		return this.linkForeign || this.model.getLinkParam(link, 'foreign');
	}

	setup() {
		super.setup();

		this.nameHashName = this.getFieldLink() + 'Names';
		this.idsName = this.getFieldLink() + 'Ids';
		this.foreignScope = this.getLinkEntity();

		this.displayAsLabel = this.params.displayAsLabel || this.displayAsLabel;
		this.displayAsList = this.params.displayAsList || this.displayAsList;
		this.displayAsLinks = this.params.displayAsLinks || this.displayAsLinks;
		this.styleMap = this.params.styleMap || this.styleMap;
	}
});
