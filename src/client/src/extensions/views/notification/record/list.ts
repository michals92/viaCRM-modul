import type NotificationRecordListView from 'espocrm/src/views/notification/record/list';

extend<NotificationRecordListView>(Dep => class extends Dep {
	disableQuickViewContextMenu = true;
});
