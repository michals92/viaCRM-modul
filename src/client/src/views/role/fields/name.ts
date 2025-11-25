define(['views/fields/varchar'], Dep => class extends Dep {
	override detailTemplate = 'viacrm:role/fields/name/detail';
	override listTemplate = 'viacrm:role/fields/name/list';
	override listLinkTemplate = 'viacrm:role/fields/name/list-link';

	override data() {
		return {
			...super.data(),
			iconHtml: this.getIconHtml(),
		};
	}

	getIconHtml() {
		const id = this.model.id;

		if (!id) {
			return '';
		}

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

		return iconHtml;
	}
});
