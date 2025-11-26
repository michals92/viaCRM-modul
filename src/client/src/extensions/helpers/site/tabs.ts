import type TabsHelper from 'espocrm/src/helpers/site/tabs';

interface TabItem {
	type?: string;
	[key: string]: unknown;
}

extend<TabsHelper>(Dep => class extends Dep {
	override isTabGroup(item: TabItem): boolean {
		return super.isTabGroup(item) && item.type !== 'customLink';
	}
});
