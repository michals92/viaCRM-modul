import type {QuickViewContextMenuHelper as QuickViewHelperType} from 'viacrm:helpers/quick-view-context-menu';
import type {RecordModal as RecordModalType} from 'helpers/record-modal';
import type SchedulerView from 'espocrm/src/modules/advanced/src/views/scheduler/scheduler';

extend<SchedulerView>(
	['viacrm:helpers/quick-view-context-menu', 'helpers/record-modal'],
	(Dep, QuickViewHelper: typeof QuickViewHelperType, RecordModal: typeof RecordModalType) => class extends Dep {
		groupScope = 'User';
		calendarType!: string;

		setup(): void {
			super.setup();

			new QuickViewHelper().register(this, 'span[data-id]');
		}

		getGroupContent(id: string, name: string): string {
			if (this.calendarType === 'single') {
				return $('<span>').attr('data-id', id).text(name).get(0)!.outerHTML;
			} else {
				let avatarHtml = this.getAvatarHtml(id);

				if (avatarHtml) {
					avatarHtml += ' ';
				}

				return avatarHtml + $('<span>').attr('data-id', id).addClass('group-title').text(name).get(0)!.outerHTML;
			}
		}

		actionQuickView(data: { id: string }): void {
			const id = data.id;

			const helper = new RecordModal(this.getMetadata(), this.getAcl());

			helper.showDetail(this, {
				id: id,
				scope: this.groupScope,
				rootUrl: null,
				editDisabled: true,
			});
		}
	},
);
