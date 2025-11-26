import type LoginView from 'espocrm/src/views/login';

type LogoHelperConstructor = new (
	config: unknown,
	helper: unknown,
	themeManager: unknown
) => {
	getLogoSrc(): string;
};

extend<LoginView>(['viacrm:helpers/logo'], (Dep, LogoHelper: LogoHelperConstructor) => class extends Dep {
	private $body!: JQuery;

	override setup(): void {
		super.setup();

		this.once('remove', () => this.$body.removeClass('has-login'));
	}

	override afterRender(): void {
		super.afterRender();

		this.$body = $('body');
		this.$body.addClass('has-login');
	}

	override getLogoSrc(): string {
		const logoHelper = new LogoHelper(this.getConfig(), this.getHelper(), this.getThemeManager());

		return logoHelper.getLogoSrc();
	}
});
