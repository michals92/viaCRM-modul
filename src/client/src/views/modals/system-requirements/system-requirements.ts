import type View from "espocrm/src/view";

define(['views/admin/system-requirements/index'], (Dep: typeof View) => class extends Dep {
	override setup() {
		super.setup();

		this.templateContent = this.options.template as string;
	}
});