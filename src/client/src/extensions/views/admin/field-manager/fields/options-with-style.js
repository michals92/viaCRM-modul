extend(Dep => class extends Dep {
	setup() {
		super.setup();

		this.optionsIconMap = this.model.get('icons') || {};

		this.addActionHandler('selectIcon', e => {
			const value = this.$el
				.find('.list-group-item')
				.filter((_, child) => $.contains(child, e.target))
				.data('value');

			this.createView('dialog', 'views/admin/entity-manager/modals/select-icon', {}, view => {
				view.render();

				this.listenToOnce(view, 'select', iconClass => {
					if (iconClass === '') {
						iconClass = null;
					}

					this.changeIcon(value, iconClass);

					view.close();
				});
			});
		});
	}

	changeStyle(value, style) {
		let valueInternal = value.replace(/"/g, '\\"');

		let $item = this.$el.find('.list-group-item[data-value="' + valueInternal + '"] .item-icon span').get(1);

		const iconClass = this.optionsIconMap[value] || null;

		const iconColor = style || 'default';

		if (iconClass) {
			$item.className = `fas ${iconClass} text-${iconColor}`;
		}

		$item.className = super.changeStyle(value, style);
	}

	changeIcon(value, icon) {
		let valueInternal = value.replace(/"/g, '\\"');

		let $item = this.$el.find('.list-group-item[data-value="' + valueInternal + '"] .item-icon span').get(1);

		if (icon === '') {
			icon = null;
		}

		const iconColor = this.optionsStyleMap[value] || 'default';

		if (icon) {
			$item.className = `fas ${icon} text-${iconColor}`;
		}

		this.optionsIconMap[value] = icon;
	}

	getItemHtml(value) {
		let html = super.getItemHtml(value);
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

		return $html.prop('outerHTML');
	}

	fetch() {
		const data = super.fetch();

		data.icons = {};

		(data.options || []).forEach(item => {
			data.icons[item] = this.optionsIconMap[item] || null;
		});

		return data;
	}
});
