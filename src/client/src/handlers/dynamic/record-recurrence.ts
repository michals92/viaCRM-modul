define(['dynamic-handler'], Dep => class extends Dep {
	override init() {
		this.onChangeInfinite();
	}

	onChangeInfinite() {
		if (this.model.get('infinite')) {
			this.recordView.hideField('until');
			this.recordView.setFieldNotRequired('until');
		} else {
			this.recordView.showField('until');
			this.recordView.setFieldRequired('until');
		}
	}
});