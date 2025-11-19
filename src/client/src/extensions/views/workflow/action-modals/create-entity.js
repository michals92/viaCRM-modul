extend(Dep => class extends Dep {
	createView(key, viewName, options, callback, wait) {
		if (key === 'addField') {
			const listenerCallback = view => {
				this.listenTo(view, 'add-field', field => {
					if (!~this.actionData.fieldList.indexOf(field)) {
						this.actionData.fieldList.push(field);
						this.actionData.fields[field] = {};

						this.addField(field, false, true);
					}
				});
			};

			if (!callback) {
				callback = listenerCallback;
			} else {
				const originalCallback = callback;
				callback = view => {
					originalCallback(view);
					listenerCallback(view);
				};
			}
		}

		super.createView(key, viewName, options, callback, wait);
	}
});
