import type LinkMultipleWithPrimaryFieldView from 'espocrm/src/views/fields/link-multiple-with-primary';

interface SelectFilters {
	[key: string]: unknown;
}

extend<LinkMultipleWithPrimaryFieldView>(Dep => class extends Dep {
	defaultSelectFilters: SelectFilters | null = null;

	override init(): void {
		super.init();
		this._processOption('defaultSelectFilters', {});
	}

	_processOption(key: string, def: unknown = null): void {
		this[key] = this.options[key] ?? this.params[key] ?? this[key] ?? def;
	}

	override getValueForDisplay(): string | undefined {
		if (this.isDetailMode() || this.isListMode()) {
			const itemList: string[] = [];

			if (this.primaryId) {
				itemList.push(
					this.getDetailPrimaryLinkHtml(
						this.primaryId,
						this.primaryName,
					),
				);
			}

			if (!this.ids.length) {
				return undefined;
			}

			this.ids.forEach((id: string) => {
				if (id !== this.primaryId) {
					itemList.push(this.getDetailLinkHtml(id));
				}
			});

			return itemList
				.map(item => $('<div>').append(item).get(0)!.outerHTML)
				.join('');
		}

		return undefined;
	}

	getDetailPrimaryLinkHtml(id: string, name?: string): string {
		// Do not use the `html` method to avoid XSS.

		let displayName = name || this.nameHash[id] || id;

		if (!displayName && id) {
			displayName = this.translate(this.foreignScope, 'scopeNames');
		}

		const iconHtml = this.isDetailMode() ? this.getIconHtml(id) : '';

		const $a = $('<a>')
			.attr('href', this.getUrl(id))
			.attr('data-id', id)
			.append($('<strong>').text(displayName || ''));

		if (iconHtml) {
			$a.prepend(iconHtml);
		}

		return $a.get(0)!.outerHTML;
	}

	/**
	 * Get advanced filters (field filters) to be applied when select a record.
	 * Override to support defaultSelectFilters from field parameters.
	 */
	override getSelectFilters(): SelectFilters | null {
		if (this.defaultSelectFilters) {
			return this.defaultSelectFilters;
		}

		const defaultSelectFiltersParam = this.getFieldParamValue('defaultSelectFilters');

		// Due to ambiguity, Espo saves an empty object as an empty array in metadata. Thanks PHP!
		return typeof defaultSelectFiltersParam === 'object' && defaultSelectFiltersParam !== null
			? defaultSelectFiltersParam
			: {};
	}
});
