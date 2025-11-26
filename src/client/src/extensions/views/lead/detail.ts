import type LeadDetailView from 'espocrm/src/views/lead/detail';

extend<LeadDetailView>(Dep => class extends Dep {
	isConvertable(): boolean {
		const hideConvertButton = this.getMetadata().get(['clientDefs', 'Lead', 'hideConvertButton']) as boolean || false;

		return super.isConvertable() && !hideConvertButton;
	}
});
