import type LayoutGridView from 'espocrm/src/views/admin/layouts/grid';

type ButtonDef = {
	name: string;
	label: string;
};

extend<LayoutGridView>(Dep => class extends Dep {
	override template = 'viacrm:admin/layouts/grid';

	override setup(): void {
		super.setup();

		this.setupEvents();

		if (!this.buttonList.some((button: ButtonDef) => button.name === 'copyAsJson')) {
			this.buttonList.push({
				name: 'copyAsJson',
				label: 'Copy as JSON',
			});
		}
	}

	setupEvents(): void {
		this.events['keyup input[data-name="quick-search"]'] = (e: Event) => this.processQuickSearch((e.currentTarget as HTMLInputElement).value);
		this.events['click button[data-action="copyAsJson"]'] = () => this.copyAsJson();
	}

	processQuickSearch(text: string): void {
		text = text.trim().toLowerCase();

		this.$el.find('.disabled.cells .cell').each((_: number, el: HTMLElement) => {
			const $el = $(el);
			const fieldName = $el.data('name') as string;
			const fieldLabel = $el.find('.left').text().toLowerCase();

			if (!text || fieldName.toLowerCase().indexOf(text) !== -1 || fieldLabel.indexOf(text) !== -1) {
				$el.removeClass('hidden');
			} else {
				$el.addClass('hidden');
			}
		});
	}

	copyAsJson(): void {
		const layout = this.fetch();
		const jsonString = JSON.stringify(layout, null, 2);

		navigator.clipboard.writeText(jsonString).then(() => {
			Espo.Ui.success(this.translate('Copied to clipboard'));
		});
	}
});
