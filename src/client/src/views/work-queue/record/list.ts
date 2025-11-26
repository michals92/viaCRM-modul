/* eslint-disable @typescript-eslint/no-explicit-any */
define(['viacrm:views/record/partitioned', 'helpers/record-modal'], (Dep: any, RecordModal: any) => {
	return class extends Dep {
		// Prevents an empty space showing
		data() {
			return {
				...super.data(),
				topBar: false,
			};
		}

		buildRowsInternal(
			groupList: unknown,
			callback: unknown,
			nestedViewCallback?: (view: any) => void,
		) {
			const newNestedViewCallback = (view: any) => {
				view.actionQuickView = function (this: any, data: any) {
					data = data || {};

					const id = data.id;

					if (!id) {
						console.error('No id.');

						return;
					}

					const sourceModel = this.collection.get(id);

					const scope = sourceModel.get('scope');

					if (!scope) {
						console.error('No scope.');

						return;
					}

					this.getModelFactory().create(scope, (model: any) => {
						model.id = id;

						model.urlRoot = scope;
						model.scope = scope;
						model.entityType = scope;

						model.collection = sourceModel.collection;

						if (this.quickDetailDisabled) {
							this.getRouter().navigate('#' + scope + '/view/' + id, { trigger: true });

							return;
						}

						const helper = new RecordModal(this.getMetadata(), this.getAcl());

						model.fetch().then(() => {
							helper
								.showDetail(this, {
									id,
									scope,
									model,
									rootUrl: this.options.keepCurrentRootUrl ? this.getRouter().getCurrentUrl() : null,
									editDisabled: this.quickEditDisabled,
								})
								.then((view: any) => {
									this.listenTo(view, 'after:save', (model: any) => {
										this.trigger('after:save', model);
									});

									this.listenTo(view, 'after:destroy', (model: any) =>
										this.removeRecordFromList(model.id),
									);
								});
						});
					});
				};

				view.processLinkClick = function (this: any, id: string) {
					const model = this.collection.get(id);
					const scope = model.get('scope');

					this.getModelFactory().create(scope, (model: any) => {
						model.id = id;

						model.urlRoot = scope;
						model.scope = scope;
						model.entityType = scope;

						const options: any = {
							id,
							model,
						};

						if (this.options.keepCurrentRootUrl) {
							options.rootUrl = this.getRouter().getCurrentUrl();
						}

						options.rootData = this.rootData;

						this.getRouter().navigate(`#${scope}/view/${id}`, { trigger: false });
						this.getRouter().dispatch(scope, 'view', options);
					});
				};

				if (nestedViewCallback) {
					nestedViewCallback(view);
				}
			};

			super.buildRowsInternal(groupList, callback, newNestedViewCallback);
		}
	};
});
