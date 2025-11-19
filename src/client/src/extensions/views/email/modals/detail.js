extend(Dep => class extends Dep {
	setup() {
		const emailDoNotMarkAsReadList = this.getPreferences().get('emailDoNotMarkAsReadList') || [];
		const readType = this.type === 'detailSmall' ? 'rightClickPreview' : null;
		if (readType) {
			if (emailDoNotMarkAsReadList.includes(readType)) {
				if (this.model) {
					const originalSet = this.model.set;
					this.model.set = function (key, val, options) {
						const attrs = typeof key === 'object' ? key : {};
						if (typeof key !== 'object') {
							attrs[key] = val;
						}

						if (attrs.isRead === true) {
							console.info(`Email is not marked as read. type:${readType} in typeList:` + emailDoNotMarkAsReadList.join(","));
							delete attrs.isRead;
						}

						return originalSet.call(this, attrs, typeof key === 'object' ? val : options);
					}.bind(this.model);
				}
			}

			const originalFetch = this.model.fetch;
			this.model.fetch = function (options = {}) {
				const queryParams = {
					data: {readType},
				};
				const mergedOptions = {...options, ...queryParams};
				return originalFetch.call(this, mergedOptions);
			};
		}

		super.setup();
	}
});
