import type Settings from "espocrm/src/models/settings";
import type ThemeManager from "espocrm/src/theme-manager";
import type ViewHelper from "espocrm/src/view-helper";

define(() => class {

	config: Settings;
	helper: ViewHelper;
	themeManager: ThemeManager;

	constructor(
		config: Settings,
		helper: ViewHelper,
		themeManager: ThemeManager
	) {
		this.config = config;
		this.helper = helper;
		this.themeManager = themeManager;
	}

	getBasePath(): string {
		return this.helper.basePath;
	}

	getConfig(): Settings {
		return this.config;
	}

	getThemeManager(): ThemeManager {
		return this.themeManager;
	}

	getLogoSrc() {
		const companyLogoId = this.getConfig().get('companyLogoId');

		if (!companyLogoId) {
			const basePath = this.getBasePath();

			const themeLogo = this.getThemeManager().getParam('logo');

			if (themeLogo && !['client/img/logo.svg', 'client/img/logo-light.svg'].includes(themeLogo)) {
				return basePath + themeLogo;
			} else {
				return basePath + 'client/modules/autocrm/img/autoerp-logo.png';
			}
		}

		return `${this.getBasePath()}?entryPoint=LogoImage&id=${companyLogoId}`;
	}

});