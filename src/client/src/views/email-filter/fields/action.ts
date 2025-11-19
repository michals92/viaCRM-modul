define(['views/fields/enum'], (Dep) => class extends Dep {
	private actionClassNameMapKeys: string[] = [];

	override setup(): void {
		this.reloadActionClassNameMapKeys();
			
		super.setup();
	}

	override setupOptions(): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.options.customOptionList = [...(this.options.customOptionList || []), ...this.getUniqueOptions((this.actionClassNameMapKeys))];
	}

	override setOptionList(optionList: string[]): Promise<void> {
		return super.setOptionList(this.getUniqueOptions(optionList));
	}

	getUniqueOptions(optionList: string[]): string[] {
		return Array.from(new Set([
			...optionList,
			...this.actionClassNameMapKeys
		]));
	}

	reloadActionClassNameMapKeys(): void {
		this.actionClassNameMapKeys = Object.keys(this.getMetadata().get(['app', 'email', 'actionClassNameMap']) || {});
	}

});
