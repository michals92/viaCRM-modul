import type DefaultSidePanelView from 'espocrm/src/views/record/panels/default-side';

interface RecordViewObject {
	hideField(name: string): void;
}

extend<DefaultSidePanelView>(Dep => class extends Dep {
	declare recordViewObject: RecordViewObject;

	override controlFollowersField(): void {
		if (this.getConfig().get('disableFollow', false)) {
			this.recordViewObject.hideField('followers');
		} else {
			super.controlFollowersField();
		}
	}
});
