import type DetailView from 'espocrm/src/views/detail';

define(['action-handler'], Dep => class extends Dep<DetailView> {
	init() {
		if (!this.view.getUser().isAdmin() || this.view.model.id === this.view.getUser().id) {
			this.view.hideHeaderActionItem('viewAs');
		} else {
			this.view.showHeaderActionItem('viewAs');
		}
	}

	actionViewAs() {
		document.cookie = 'view-as-user-id=' + this.view.model.id + '; SameSite=Lax; path=/';
		window.location.href = '/';
	}
});
