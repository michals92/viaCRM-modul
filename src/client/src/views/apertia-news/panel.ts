define(['view'], (Dep) => class extends Dep {
	override template = 'viacrm:apertia-news/panel';

	override data() {
		return {
			iframeUrl: this.options.iframeUrl + "?date=yesterday&lang=cs_CZ",
			iframeHeight: this.options.iframeHeight,
			iframeDisabled: this.options.iframeDisabled
		};
	}
});