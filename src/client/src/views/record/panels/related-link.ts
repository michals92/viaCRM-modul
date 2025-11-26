define(['views/record/panels/relationship'], Dep => class extends Dep {
	override setup() {
		this.link = this.link || this.defs.link || this.panelName;

		const parts = this.link.split('.');
		this.parentLink = parts[0];
		this.parentScope = this.getMetadata().get([
			'entityDefs',
			this.model.name,
			'links',
			this.parentLink,
			'entity',
		]);
		this.panelLink = parts[1];
		this.scope = this.getMetadata().get(['entityDefs', this.parentScope, 'links', this.panelLink, 'entity']);

		// custom route, that invokes `RelatedLinkLister` controller
		// there is static 'related' URL part, so the routes don't conflict with core routes for field manager
		// see https://github.com/slimphp/Slim/issues/258
		this.url = this.model.name + '/' + this.model.id + '/' + this.parentLink + '/related/' + this.panelLink;

		super.setup();
	}

	setupTitle() {
		this.title =
				this.translate(this.parentLink, 'links', this.model.name) +
				' > ' +
				(this.translate(this.panelLink, 'links', this.parentScope) ||
					this.translate(this.panelLink, 'panels', this.parentScope));

		let iconHtml = '';
		if (!this.getConfig().get('scopeColorsDisabled')) {
			iconHtml = this.getHelper().getScopeColorIconHtml(this.scope);
		}

		this.titleHtml = iconHtml + this.title;
	}
});
