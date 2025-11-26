import type {
	LayoutsActionOptions,
	LinkManagerActionOptions,
	ConversionsActionOptions,
	ColorizationActionOptions,
	EntityManagerActionOptions,
} from 'viacrm/types';

define(['controllers/admin'], Dep => class extends Dep {
	override actionLayouts(options: LayoutsActionOptions) {
		const scope = options.scope || null;
		const type = options.type || null;
		const em = options.em || false;

		this.main('viacrm:views/admin/layouts/index', {
			scope,
			type,
			em,
		});
	}

	override actionLinkManager(options: LinkManagerActionOptions) {
		const scope = options.scope || null;

		this.main('viacrm:views/admin/link-manager/index', {
			scope,
		});
	}

	actionConversions(options: ConversionsActionOptions) {
		const scope = options.scope || null;

		this.main('viacrm:views/admin/conversions', {
			scope,
		});
	}

	actionColorization(options: ColorizationActionOptions) {
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
						view: 'viacrm:views/admin/colorization/fields/colorization-rules'
					}
				};

				// @ts-ignore oof
				model.parentEntityType = scope;

				this.main('viacrm:views/admin/colorization', {
					scope,
					model
				});
			});
	}

	override actionEntityManager(options: EntityManagerActionOptions) {
		if (options.clone && options.fromScope) {
			this.main('viacrm:views/admin/entity-manager/clone', { fromScope: options.fromScope });
		}

		super.actionEntityManager(options);
	}
});
