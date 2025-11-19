import type { Action } from "espocrm/src/acl-manager";

define(['views/record/detail'], Dep => class extends Dep {
	override editModeDisabled = true;

	override exit(after?: Action | string): void {
		this.scope = 'RecordTemplate';

		// @ts-ignore oof
		this.model = this.recordTemplateModel;

		super.exit(after);
	}
});