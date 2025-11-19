define(['views/user/fields/teams'], Dep => class extends Dep {
	getDetailLinkHtml(id, name) {
		name = name || this.nameHash[id] || id;

		let role = (this.columns[id] || {})[this.columnName] || '';

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

		const $el = $('<div>').append(
			$('<a>')
				.attr('href', '#' + this.foreignScope + '/view/' + id)
				.attr('data-id', id)
				.text(name),
		);

		if (iconHtml) {
			$el.prepend(iconHtml);
		}

		if (role) {
			role = this.getHelper().escapeString(role);

			$el.append(
				$('<span>').text(' '),
				$('<span>').addClass('text-muted middle-dot'),
				$('<span>').text(' '),
				$('<span>').addClass('text-muted').text(role),
			);
		}

		return $el.get(0).outerHTML;
	}
});
