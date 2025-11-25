extend(['viacrm:helpers/quick-view-context-menu', 'helpers/record-modal'], (Dep, QuickViewHelper, RecordModal) => class extends Dep {
	groupScope = 'User';

	setup() {
		super.setup();

		new QuickViewHelper().register(this, 'span[data-id]');
	}

	getGroupContent(id, name) {
		if (this.calendarType === 'single') {
			return $('<span>').attr('data-id', id).text(name).get(0).outerHTML;
		} else {
			let avatarHtml = this.getAvatarHtml(id);

			if (avatarHtml) {
				avatarHtml += ' ';
			}

			return avatarHtml + $('<span>').attr('data-id', id).addClass('group-title').text(name).get(0).outerHTML;
		}
	}

	actionQuickView(data) {
		const id = data.id;

		const helper = new RecordModal(this.getMetadata(), this.getAcl());

		helper.showDetail(this, {
			id: id,
			scope: this.groupScope,
			rootUrl: null,
			editDisabled: true,
		});
	}
});
