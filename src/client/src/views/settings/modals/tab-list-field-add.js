define(['views/settings/modals/tab-list-field-add'], Dep => class extends Dep {
	setup() {
		super.setup();

		this.buttonList.push({
			name: 'addCustomLink',
			html: this.translate('Custom Link', 'labels', 'Settings'),
		});
	}

	actionAddCustomLink() {
		this.trigger('add', {
			type: 'customLink',
			text: this.translate('Custom Link', 'labels', 'Settings'),
			iconClass: null,
			color: null,
		});
	}
});
