extend(Dep => class extends Dep {
	controlFollowersField() {
		if (this.getConfig().get('disableFollow', false)) {
			this.recordViewObject.hideField('followers');
		} else {
			super.controlFollowersField();
		}
	}
});
