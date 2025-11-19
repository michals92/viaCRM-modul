extend(Dep => class extends Dep {
	getDetailLinkHtml(id, name) {
		// Do not use the `html` method to avoid XSS.

		name = name || this.nameHash[id] || id;

		if (!name && id) {
			name = this.translate(this.foreignScope, 'scopeNames');
		}

		const teamStyles = this.getHelper().getAppParam('teamStyles') || {};

		let iconHtml = '';

		const style = teamStyles[id] || {};
		const iconClass = style.iconClass || '';
		const color = style.color || '';

		if (iconClass) {
			let styleAttr = '';

			if (color) {
				styleAttr = ` style="color: ${color};"`;
			}

			iconHtml = `<span class="${iconClass}"${styleAttr}></span> `;
		}

		const $a = $('<a>').attr('href', this.getUrl(id)).attr('data-id', id).text(name);

		if (this.isListMode()) {
			$a.addClass('text-default');
		}

		if (iconHtml) {
			$a.prepend(iconHtml);
		}

		return $a.get(0).outerHTML;
	}
});
