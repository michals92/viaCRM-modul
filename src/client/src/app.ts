extend(Dep => class extends Dep {

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	override onAuth(afterLogin: boolean): void {
		if (this.webSocketManager) {
			this.webSocketManager.connect(this.auth, this.user.id);

			this.webSocketManager.subscribe('viacrm.language', (_topic: string, data: any) => {
				if (typeof data !== 'object' || !data.data || typeof data.data !== 'object') {
					console.error("Typeof language data is not an object");
					return;
				}
					
				this.loadAdditionalLanguageData(data.data);
			});
		}

		super.onAuth(afterLogin);
	}

	loadAdditionalLanguageData(data: any): void {
		Object.entries(data).forEach(([scope, categories]: [string, any]) => {
			if (typeof categories !== 'object') {
				console.error("Typeof language categories is not an object");
				return;
			}

			const scopeData = this.language.data[scope];
			Object.entries(categories).forEach(([categoryName, values]: [string, any]) => {
				const categoryValues = scopeData[categoryName];
				this.language.data[scope][categoryName] = {...categoryValues, ...values};
			});
		});
	}
});