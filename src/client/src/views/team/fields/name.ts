define(['views/fields/varchar'], Dep => class extends Dep {
	override detailTemplate = 'viacrm:teams/fields/name/detail';
	override listTemplate = 'viacrm:teams/fields/name/list';
	override listLinkTemplate = 'viacrm:teams/fields/name/list-link';

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

		return iconHtml;
	}
});
