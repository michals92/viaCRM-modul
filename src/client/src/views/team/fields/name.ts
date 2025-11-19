define(['views/fields/varchar'], Dep => class extends Dep {
	override detailTemplate = 'autocrm:teams/fields/name/detail';
	override listTemplate = 'autocrm:teams/fields/name/list';
	override listLinkTemplate = 'autocrm:teams/fields/name/list-link';

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
