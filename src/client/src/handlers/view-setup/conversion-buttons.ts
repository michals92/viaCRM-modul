import type DetailView from 'espocrm/src/views/detail';

define(() => {
	class Handler {
		protected view: DetailView;
		protected scope?: string | null = null;
		protected conversionData?: Record<string, unknown> | null = null;

		constructor(view: DetailView) {
			this.view = view;

			this.scope = this.view['scope'] as string;

			this.conversionData = this.view.getMetadata().get<Record<string, unknown>>(['conversionDefs', this.scope]);
		}

		public process() {
			if (!this.scope) {
				return;
			}

			if (!this.conversionData) {
				return;
			}

			this.addConversionButtons();
		}

		protected addConversionButtons(): void {
			for (const foreignScope in this.conversionData) {
				const actionName = 'autocrmConvertTo' + Espo.Utils.upperCaseFirst(foreignScope);
				let translatedScope = this.view.translate(foreignScope, 'scopeNamesAccusative');
				if (translatedScope === foreignScope) {
					translatedScope = this.view.translate(foreignScope, 'scopeNames');
				}

				this.view.addMenuItem('buttons', {
					name: actionName,
					action: actionName,
					label:
                        this.view.translate('Convert to') +
                        ' ' +
                        translatedScope,
					acl: 'create',
					aclScope: foreignScope,
					data: {
						scope: foreignScope,
					},
				});

				this.view['action' + Espo.Utils.upperCaseFirst(actionName)] = (data: Record<string, any>) => {
					Espo.Ui.notify(this.view.translate('Processing conversion...'));

					const id = this.view.model.id;
					const entityType = this.scope;
					const route = `GetConvertAttributes/${entityType}/${id}/${foreignScope}`;

					Espo.Ajax.getRequest(route)
						.then(attributes => {
							Espo.Ui.notify(false);

							const url = `#${foreignScope}/create`;

							const router = this.view.getRouter();

							router.dispatch(data.scope, 'create', {
								attributes,
								returnUrl: router.getCurrentUrl(),
								options: {
									duplicateSourceId: id,
								},
							});

							router.navigate(url, {trigger: false});
						})
						.catch(error => {
							Espo.Ui.notify(false);
							Espo.Ui.error('Failed to process conversion.');

							console.error('Conversion error:', error);
						});
				};
			}
		}
	}

	//@ts-ignore oof
	Object.assign(Handler.prototype, Backbone.Events);

	return Handler;
});
