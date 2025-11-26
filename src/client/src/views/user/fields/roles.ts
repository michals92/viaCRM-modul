define(['views/fields/link-multiple'], Dep => class extends Dep {
	getDetailLinkHtml(id, name) {
		name = name || this.nameHash[id] || id;

		const roleStyles = this.getHelper().getAppParam('roleStyles') || {};

		let iconHtml = '';

		const style = roleStyles[id] || {};
		const iconClass = style.iconClass || '';
		const color = style.color || '';

		if (iconClass) {
			let styleAttr = '';

			if (color) {
				styleAttr = ` style="color: ${color};"`;
			}

			iconHtml = `<span class="${iconClass}"${styleAttr}></span> `;
		}

		const $el = $('<div>').append(
			$('<a>')
				.attr('href', '#' + this.foreignScope + '/view/' + id)
				.attr('data-id', id)
				.text(name),
		);

		if (iconHtml) {
			$el.prepend(iconHtml);
		}

		return $el.get(0).outerHTML;
	}
});
