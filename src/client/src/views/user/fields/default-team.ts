interface TeamStyle {
	iconClass?: string;
	color?: string;
}

interface TeamStyles {
	[teamId: string]: TeamStyle;
}

define(['views/user/fields/default-team'], Dep => class extends Dep {
	override data() {
		const data = super.data();

		const id = this.model.get<string>(this.idName);

		const teamStyles = (this.getHelper().getAppParam<TeamStyles>('teamStyles') || {});

		let iconHtml = '';

		let style: TeamStyle = {};
			
		if (id) {
			style = teamStyles[id] || {};
		}

		const iconClass = style.iconClass;
		const color = style.color;

		if (iconClass) {
			let styleAttr = '';

			if (color) {
				styleAttr = ` style="color: ${color};"`;
			}

			iconHtml = `<span class="${iconClass}"${styleAttr}></span> `;
		}

		data.iconHtml = iconHtml;

		return data;
	}
});
