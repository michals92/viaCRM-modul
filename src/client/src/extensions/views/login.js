extend(['autocrm:helpers/logo'], (Dep, LogoHelper) => class extends Dep {
	setup() {
		super.setup();

		this.once('remove', () => this.$body.removeClass('has-login'));
	}

	afterRender() {
		super.afterRender();

		this.$body = $('body');
		this.$body.addClass('has-login');
	}

	getLogoSrc() {
		const logoHelper = new LogoHelper(this.getConfig(), this.getHelper(), this.getThemeManager());

		return logoHelper.getLogoSrc();
	}
});
