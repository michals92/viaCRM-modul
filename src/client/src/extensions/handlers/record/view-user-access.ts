import type ViewUserAccessHandler from 'espocrm/src/handlers/record/view-user-access';

extend<ViewUserAccessHandler>(Dep => class extends Dep {
	override getActionList(): string[] {
		return [...super.getActionList(), 'print'];
	}
});
