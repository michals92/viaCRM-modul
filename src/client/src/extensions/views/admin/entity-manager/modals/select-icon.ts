import type _default from 'espocrm/src/views/admin/entity-manager/modals/select-icon';

extend<_default>(Dep => class extends Dep {
	declare iconList: string[];

	override setup(): void {
		super.setup();

		const customIconClasses = ((this.getHelper().getAppParam('customIcons') as string[]) || []).map(
			(icon: string) => `custom-icon-${icon}`,
		);

		this.iconList.push(...customIconClasses);
	}
});
