import type { Extension } from "espocrm/src/views/site/master";
import type MasterView from "espocrm/src/views/site/master";

extend((Dep: typeof MasterView) => class extends Dep {
	override processExtensions(list: Extension[]): void {
		if (!this.getConfig().get<boolean>('disableExtensionLicenseMessage')) {
			super.processExtensions(list);
		}
	}
});