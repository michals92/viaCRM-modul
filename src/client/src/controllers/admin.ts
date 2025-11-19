define(['controllers/admin'], Dep => class extends Dep {
	override actionLayouts(options: any) {
		const scope = options.scope || null;
		const type = options.type || null;
		const em = options.em || false;

		this.main('autocrm:views/admin/layouts/index', {
			scope,
			type,
			em,
		});
	}

	override actionLinkManager(options: any) {
		const scope = options.scope || null;

		this.main('autocrm:views/admin/link-manager/index', {
			scope,
		});
	}

	actionConversions(options: any) {
		const scope = options.scope || null;

		this.main('autocrm:views/admin/conversions', {
			scope,
		});
	}

	actionColorization(options: any) {
		const scope = options.scope;

		if (!scope) {
			return;
		}

		this.modelFactory.create('Colorization')
			.then(model => {
				this.hideLoadingNotification();

				const metadata = this.getMetadata();

				const rules = metadata.get(['colorizationDefs', scope, 'rules']) || [];

				model.set('rules', rules);

				model.defs.fields = {
					rules: {
						view: 'autocrm:views/admin/colorization/fields/colorization-rules'
					}
				};

				// @ts-ignore oof
				model.parentEntityType = scope;

				this.main('autocrm:views/admin/colorization', {
					scope,
					model
				});
			});
	}

	override actionEntityManager(options: any) {
		if (options.clone && options.fromScope) {
			this.main('autocrm:views/admin/entity-manager/clone', { fromScope: options.fromScope });
		}

		super.actionEntityManager(options);
	}
});
