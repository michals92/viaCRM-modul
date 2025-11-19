extend(Dep => class extends Dep {

	init(){
		super.init();
		this._processOption('defaultSelectFilters', {});
	}

	_processOption(key, def = null) {
		this[key] = this.options[key] ?? this.params[key] ?? this[key] ?? def;
	}

	getValueForDisplay() {
		if (this.isDetailMode() || this.isListMode()) {
			let itemList = [];

			if (this.primaryId) {
				itemList.push(
					this.getDetailPrimaryLinkHtml(
						this.primaryId,
						this.primaryName,
					),
				);
			}

			if (!this.ids.length) {
				return;
			}

			this.ids.forEach(id => {
				if (id !== this.primaryId) {
					itemList.push(this.getDetailLinkHtml(id));
				}
			});

			return itemList
				.map(item => $('<div>').append(item).get(0).outerHTML)
				.join('');
		}
	}

	getDetailPrimaryLinkHtml(id, name) {
		// Do not use the `html` method to avoid XSS.

		name = name || this.nameHash[id] || id;

		if (!name && id) {
			name = this.translate(this.foreignScope, 'scopeNames');
		}

		const iconHtml = this.isDetailMode() ? this.getIconHtml(id) : '';

		const $a = $('<a>')
			.attr('href', this.getUrl(id))
			.attr('data-id', id)
			.append($('<strong>').text(name));

		if (iconHtml) {
			$a.prepend(iconHtml);
		}

		return $a.get(0).outerHTML;
	}

	/**
		 * Get advanced filters (field filters) to be applied when select a record.
		 * Override to support defaultSelectFilters from field parameters.
		 *
		 * @protected
		 * @return {Object.<string, module:search-manager~advancedFilter>|null}
		 */
	getSelectFilters() {
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
