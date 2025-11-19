extend(Dep => class extends Dep {
	initFollowButtons() {
		if (this.getConfig().get('disableFollow', false)) {
			return;
		} else {
			super.initFollowButtons();
		}
	}
});
