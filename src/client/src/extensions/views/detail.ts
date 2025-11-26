import type DetailView from 'espocrm/src/views/detail';

extend<DetailView>(Dep => class extends Dep {
	initFollowButtons(): void {
		if (this.getConfig().get('disableFollow', false)) {
			return;
		} else {
			super.initFollowButtons();
		}
	}
});
