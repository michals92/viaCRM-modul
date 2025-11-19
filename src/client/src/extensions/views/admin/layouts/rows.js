extend(Dep => class extends Dep {
	template = 'autocrm:admin/layouts/rows';

	setup() {
		super.setup();

		this.setupEvents();

		if (!this.buttonList.some(button => button.name === 'copyAsJson')) {
			this.buttonList.push({
				name: 'copyAsJson',
				label: 'Copy as JSON',
			});
		}
	}

	setupEvents() {
		this.events['keyup input[data-name="quick-search"]'] = e => this.processQuickSearch(e.currentTarget.value);
		this.events['click button[data-action="copyAsJson"]'] = () => this.copyAsJson();
	}

	processQuickSearch(text) {
		text = text.trim().toLowerCase();

		this.$el.find('.disabled.connected .cell').each((_, el) => {
			const $el = $(el);
			const fieldName = $el.data('name');
			const fieldLabel = $el.find('.left span').text().toLowerCase();

			if (!text || fieldName.toLowerCase().indexOf(text) !== -1 || fieldLabel.indexOf(text) !== -1) {
				$el.removeClass('hidden');
			} else {
				$el.addClass('hidden');
			}
		});
	}

	copyAsJson() {
		const layout = this.fetch();
		const jsonString = JSON.stringify(layout, null, 2);

		navigator.clipboard.writeText(jsonString).then(() => {
			Espo.Ui.success(this.translate('Copied to clipboard'));
		});
	}
});
