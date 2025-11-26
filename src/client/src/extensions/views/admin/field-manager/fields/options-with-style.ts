import type _default from 'espocrm/src/views/admin/field-manager/fields/options-with-style';

type SelectIconView = {
	render(): void;
	close(): void;
};

type FetchData = {
	options?: string[];
	icons?: Record<string, string | null>;
	[key: string]: unknown;
};

extend<_default>(Dep => class extends Dep {
	optionsIconMap!: Record<string, string | null>;
	declare optionsStyleMap: Record<string, string>;

	override setup(): void {
		super.setup();

		this.optionsIconMap = (this.model.get('icons') as Record<string, string | null>) || {};

		this.addActionHandler('selectIcon', (e: Event) => {
			const value = this.$el
				.find('.list-group-item')
				.filter((_: number, child: HTMLElement) => $.contains(child, e.target as HTMLElement))
				.data('value') as string;

			this.createView('dialog', 'views/admin/entity-manager/modals/select-icon', {}, (view: SelectIconView) => {
				view.render();

				this.listenToOnce(view, 'select', (iconClass: string) => {
					if (iconClass === '') {
						iconClass = '';
					}

					this.changeIcon(value, iconClass || null);

					view.close();
				});
			});
		});
	}

	override changeStyle(value: string, style: string): string {
		let valueInternal = value.replace(/"/g, '\\"');

		let $item = this.$el.find('.list-group-item[data-value="' + valueInternal + '"] .item-icon span').get(1) as HTMLElement | undefined;

		const iconClass = this.optionsIconMap[value] || null;

		const iconColor = style || 'default';

		if ($item && iconClass) {
			$item.className = `fas ${iconClass} text-${iconColor}`;
		}

		if ($item) {
			$item.className = super.changeStyle(value, style) as string;
		}

		return super.changeStyle(value, style) as string;
	}

	changeIcon(value: string, icon: string | null): void {
		let valueInternal = value.replace(/"/g, '\\"');

		let $item = this.$el.find('.list-group-item[data-value="' + valueInternal + '"] .item-icon span').get(1) as HTMLElement | undefined;

		if (icon === '') {
			icon = null;
		}

		const iconColor = this.optionsStyleMap[value] || 'default';

		if ($item && icon) {
			$item.className = `fas ${icon} text-${iconColor}`;
		}

		this.optionsIconMap[value] = icon;
	}

	override getItemHtml(value: string): string {
		let html = super.getItemHtml(value) as string;
		let $html = $(html);

		const $span = $('<span/>').addClass('fas fa-angle-up');

		const $button = $('<button/>', {
			'data-action': 'selectIcon',
			type: 'button',
			tabindex: '-1',
			title: this.translate('Select'),
			class: 'btn btn-default btn-icon',
			style: 'margin-top: 0; margin-right: 10px',
		}).append($span);

		const iconClass = this.optionsIconMap[value] || null;

		const iconColor = this.optionsStyleMap[value] || 'default';

		let iconFullClass = '';

		if (iconClass) {
			iconFullClass = `fas ${iconClass} text-${iconColor}`;
		}

		const $icon = $('<span/>', {
			class: iconFullClass,
		});

		const $div = $('<div/>')
			.addClass('pull-left')
			.addClass('item-icon')
			.attr('style', 'margin-top: 0; margin-bottom: 0; margin-right: 10px')
			.append($button, $icon);

		$html.find('.item-content').prepend($div);

		$html.find('.item-content').parent().css('padding-left', '0');

		return $html.prop('outerHTML') as string;
	}

	override fetch(): FetchData {
		const data = super.fetch() as FetchData;

		data.icons = {};

		(data.options || []).forEach((item: string) => {
			data.icons![item] = this.optionsIconMap[item] || null;
		});

		return data;
	}
});
