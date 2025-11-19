define(['views/fields/multi-enum'], Dep => class extends Dep {
	names: Record<string, string | null> = {};
	ids: string[] = [];

	override allowCustomOptions = false;

	override setup() {
		this.reloadRoles();
		super.setup();
	}

	override setupOptions() {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.params.options = this.ids;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.translatedOptions = this.names;
	}

	reloadRoles() {
		this.ids = [];
		this.names = {};

		const roleList = this.getHelper().getAppParam<Record<string, any>[]>('roleList') || [];
			
		roleList.forEach((roleData) => {
			const id = roleData['id'] as string;

			this.ids.push(id);
			this.names[id] = roleData['name'] as string | null;
		});
	}
});
