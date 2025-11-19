extend(Dep => class extends Dep {
	editCustomLinkView = 'autocrm:views/settings/modals/edit-custom-link';

	addItemModalView = 'autocrm:views/settings/modals/tab-list-field-add';

	setup() {
		this.events['click [data-action="editCustomLink"]'] = e => {
			const id = $(e.currentTarget).parent().data('value').toString();

			this.editCustomLink(id);
		};

		super.setup();
	}

	editCustomLink(id) {
		const item = Espo.Utils.cloneDeep(this.getGroupValueById(id) || {});
		const index = this.getGroupIndexById(id);

		const tabList = Espo.Utils.cloneDeep(this.selected);

		this.createView(
			'dialog',
			this.editCustomLinkView,
			{
				itemData: item,
			},
			view => {
				view.render();

				this.listenToOnce(view, 'apply', itemData => {
					for (let a in itemData) {
						tabList[index][a] = itemData[a];
					}

					this.model.set(this.name, tabList);

					view.close();
				});
			},
		);
	}

	getGroupItemHtml(item) {
		if (item.type !== 'customLink') {
			return super.getGroupItemHtml(item);
		}

		return $('<div>')
			.addClass('list-group-item')
			.attr('data-value', item.id)
			.css('cursor', 'default')
			.append(
				$('<a>')
					.attr('role', 'button')
					.attr('tabindex', '0')
					.attr('data-value', item.id)
					.attr('data-action', 'editCustomLink')
					.css('margin-right', '7px')
					.append($('<span>').addClass('fas fa-pencil-alt fa-sm')),
				$('<span>').text(item.text || ''),
				'&nbsp;',
				$('<a>')
					.addClass('pull-right')
					.attr('role', 'button')
					.attr('tabindex', '0')
					.attr('data-value', item.id)
					.attr('data-action', 'removeValue')
					.append($('<span>').addClass('fas fa-times')),
			)
			.get(0).outerHTML;
	}
});
