import type TabListFieldView from 'espocrm/src/views/settings/fields/tab-list';
import type Model from 'espocrm/src/model';

interface TabItem {
	id: string;
	type?: string;
	text?: string;
	[key: string]: unknown;
}

interface EditCustomLinkModal {
	render(): void;
	close(): void;
}

extend<TabListFieldView>(Dep => class extends Dep {
	editCustomLinkView = 'viacrm:views/settings/modals/edit-custom-link';
	override addItemModalView = 'viacrm:views/settings/modals/tab-list-field-add';
	declare selected: TabItem[];
	declare name: string;
	declare model: Model;
	declare events: Record<string, (e: JQuery.TriggeredEvent) => void>;

	override setup(): void {
		this.events['click [data-action="editCustomLink"]'] = (e: JQuery.TriggeredEvent) => {
			const id = $(e.currentTarget as HTMLElement).parent().data('value').toString() as string;

			this.editCustomLink(id);
		};

		super.setup();
	}

	editCustomLink(id: string): void {
		const item = Espo.Utils.cloneDeep(this.getGroupValueById(id) || {}) as TabItem;
		const index = this.getGroupIndexById(id);

		const tabList = Espo.Utils.cloneDeep(this.selected) as TabItem[];

		this.createView(
			'dialog',
			this.editCustomLinkView,
			{
				itemData: item,
			},
			(view: EditCustomLinkModal) => {
				view.render();

				this.listenToOnce(view, 'apply', (itemData: Record<string, unknown>) => {
					for (const a in itemData) {
						tabList[index][a] = itemData[a];
					}

					this.model.set(this.name, tabList);

					view.close();
				});
			},
		);
	}

	override getGroupItemHtml(item: TabItem): string {
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
			.get(0)!.outerHTML;
	}
});
