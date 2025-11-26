import type NavbarMenuHandler from 'espocrm/src/handlers/navbar-menu';

extend<NavbarMenuHandler>((Dep: typeof NavbarMenuHandler) => class extends Dep {
	override logout() {
		if (!this.isViewingAs()) {
			super.logout();
		} else {
			document.cookie = 'view-as-user-id=; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';

			Espo.Ajax.postRequest('Admin/clearCache').then(() => setTimeout(() => window.location.reload(), 1));
		}
	}

	isViewingAs() {
		return document.cookie.indexOf('view-as-user-id') > -1;
	}
});
