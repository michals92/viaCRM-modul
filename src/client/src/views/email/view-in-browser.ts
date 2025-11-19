define(['view'], Dep => class extends Dep {
	override templateContent = '{{{html}}}';

	override data() {
		return {
			html: this.options.emailBody,
		};
	}

	override afterRender() {
		this.$el.find('a[href*="viewInBrowser"]').remove();
	}
});
