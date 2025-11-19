extend(['model'], (Dep, Model) => class extends Dep {

	template = 'autocrm:workflow/action-modals/update-entity';

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

	afterRender() {
		super.afterRender();

		this.setupSkipHooksView();
	}

	setupSkipHooksView() {
		const model = new Model;

		const info = this.element.querySelector('[data-name="skipHooks"] .field-info');

		if (info) {
			info.parentNode.removeChild(info);
		}

		model.set('skipHooks', this.actionData.skipHooks || null);

		this.createView('skipHooks', 'views/fields/bool', {
			name: 'skipHooks',
			model,
			mode: this.readOnly ? 'detail' : 'edit',
			height: 100,
			el: this.getSelector() + ' .field[data-name="skipHooks"]',
			inlineEditDisabled: true,
			targetEntityType: this.scope,
			params: {
					
			}
		}, view => {
			view.render();
		});
	}

	fetch() {
		const attributes = super.fetch();

		const skipHooksView = this.getView('skipHooks');

		if (skipHooksView) {
			this.actionData.skipHooks = skipHooksView.fetch().skipHooks;
		}

		return attributes;
	}

});
