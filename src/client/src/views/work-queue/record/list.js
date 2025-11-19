define(['autocrm:views/record/partitioned', 'helpers/record-modal'], (Dep, RecordModal) => class extends Dep {
	// Prevents an empty space showing
	data() {
		return {
			...super.data(),
			topBar: false,
		};
	}

	buildRowsInternal(groupList, callback, nestedViewCallback) {
		const newNestedViewCallback = view => {
			view.actionQuickView = function (data) {
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

				this.getModelFactory().create(scope, model => {
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
							.then(view => {
								this.listenTo(view, 'after:save', model => {
									this.trigger('after:save', model);
								});

								this.listenTo(view, 'after:destroy', model => this.removeRecordFromList(model.id));
							});
					});
				});
			};

			view.processLinkClick = function (id) {
				const model = this.collection.get(id);
				const scope = model.get('scope');

				this.getModelFactory().create(scope, model => {
					model.id = id;

					model.urlRoot = scope;
					model.scope = scope;
					model.entityType = scope;

					const options = {
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
});
