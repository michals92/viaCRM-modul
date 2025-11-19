extend(
	['autocrm:helpers/colorize'],
	(Dep, ColorizeHelper) =>
		class extends Dep {
			_internalLayoutType = 'autocrm:list-row';

			disableQuickViewContextMenu = false;

			_relatedCollectionTemplates = {};
			_relatedModelDefs = {};
			_linkScopeMap = {};
			_relatedAttributesCache = {};
			_relatedModelsCache = {};

			setup() {
				this.disableQuickViewContextMenu = !!this.options.disableQuickViewContextMenu;

				super.setup();

				this.colorizeHelper = new ColorizeHelper(this.getMetadata(), this.getUser());

				this.listenTo(this.collection, 'sync', () => {
					setTimeout(() => {
						this.colorizeHelper.applyColorsToRows(this, this.collection, this.entityType || this.scope);
					}, 100);
				});
			}

			// noinspection JSUnusedGlobalSymbols
			massActionMerge() {
				if (!this.getAcl().check(this.entityType, 'edit')) {
					Espo.Ui.error(this.translate('Access denied'));

					return false;
				}

				if (this.checkedList.length < 2) {
					Espo.Ui.error(this.translate('select2OrMoreRecords', 'messages'));

					return;
				}
				const maxMergeRecords = this.getConfig().get('massActionMergeRecordLimit') || 4;
				if (this.checkedList.length > maxMergeRecords) {
					const msg = this.translate('selectNotMoreThanNumberRecords', 'messages').replace(
						'{number}',
						maxMergeRecords.toString(),
					);

					Espo.Ui.error(msg);

					return;
				}

				this.checkedList.sort();

				const url = '#' + this.entityType + '/merge/ids=' + this.checkedList.join(',');

				this.getRouter().navigate(url, { trigger: false });

				this.getRouter().dispatch(this.entityType, 'merge', {
					ids: this.checkedList.join(','),
					collection: this.collection,
				});
			}

			actionQuickEdit(data) {
				const originalCreateView = this.createView;

				this.createView = function (key, viewName, options, ...args) {
					const layoutName = this.getParentView()?.detailSmallEditName;

					if (key === 'modal' && layoutName) {
						options = options || {};
						options.layoutName = layoutName;
					}

					return originalCreateView.call(this, key, viewName, options, ...args);
				};

				super.actionQuickEdit(data);

				this.createView = originalCreateView;
			}

			afterRender() {
				super.afterRender();
				this.adjustCheckboxSizes();
				this.colorizeHelper.applyColorsToRows(this, this.collection, this.entityType || this.scope);
				this.setupDropdownPositioning();
			}

			setupDropdownPositioning() {
				// Position dropdown menus when they open
				this.$el.on('shown.bs.dropdown', 'tr', e => {
					const $row = $(e.currentTarget);
					const $dropdown = $row.find('.list-row-dropdown-menu');
					const $toggle = $row.find('[data-toggle="dropdown"]');

					if (!$dropdown.length || !$toggle.length) {
						return;
					}

					// Get toggle button position
					const toggleRect = $toggle[0].getBoundingClientRect();

					// Position dropdown
					$dropdown.css({
						display: 'block',
						top: toggleRect.bottom + 2 + 'px',
						left: toggleRect.right - $dropdown.outerWidth() + 'px',
						position: 'fixed',
					});
				});

				// Clean up on close
				this.$el.on('hidden.bs.dropdown', 'tr', e => {
					const $row = $(e.currentTarget);
					const $dropdown = $row.find('.list-row-dropdown-menu');

					$dropdown.css({
						display: '',
						top: '',
						left: '',
					});
				});
			}

			/**
			 * Override buildRow to apply colors when rows are created
			 */
			buildRow(i, model, callback) {
				const entityType = this.entityType || this.scope;

				const color = this.colorizeHelper.getColor(model, entityType, this);

				super.buildRow(i, model, view => {
					// Apply color to the row view after it's created
					this.colorizeHelper.applyColorToRow(view, color, model.id);

					if (callback) callback(view);
				});
			}

			adjustCheckboxSizes() {
				const listCheckboxSize = this.getPreferences().get('listCheckboxSize');

				if (!listCheckboxSize) {
					return;
				}

				const className = 'checkbox-' + listCheckboxSize;

				const $checkboxes = this.$el.find('.record-checkbox-container > .form-checkbox-small');
				$checkboxes.each((_, el) => {
					const $el = $(el);
					$el.addClass(className);
				});

				const $selectAllCheckbox = this.$el.find('.select-all-container > .form-checkbox-small');
				$selectAllCheckbox.addClass(className);
			}

			_convertLayout(listLayout, model) {
				const layout = super._convertLayout(listLayout, model);

				const listLayoutObj = {};

				if (model) {
					return layout;
				}

				listLayout.forEach(item => {
					listLayoutObj[item.name] = item;
				});

				layout.forEach(item => {
					const columnName = item.columnName;

					if (columnName.includes('.')) {
						const parts = columnName.split('.');
						const link = parts[0];
						const field = parts[1];
						const templateModel = new this._relatedCollectionTemplates[link].model();
						const type = templateModel.getFieldType(field) || 'base';

						item.name = item.name.replace('.', '_') + 'Related';
						item.view =
							templateModel.getFieldParam(field, 'view') || this.getFieldManager().getViewName(type);
						item.options.labelText = this.translate(field, 'fields', templateModel.name);
					}

					if (columnName in listLayoutObj) {
						item.options.listEditDisabled = !listLayoutObj[columnName].isEditable;
						item.options.defs.breakText = listLayoutObj[columnName].breakText;
					}
				});

				return layout;
			}

			async getSelectAttributeList(callback) {
				const newCallback = attributeList => {
					const attributeSet = new Set(attributeList);

					Object.keys(this._relatedModelDefs).forEach(link => {
						const attributeName = link + 'Id';
						if (!attributeSet.has(attributeName)) {
							attributeList.push(attributeName);
						}
					});

					if (this.colorizeHelper) {
						const watchedFields = this.colorizeHelper.getWatchedFields(this.entityType || this.scope);
						watchedFields.forEach(fieldName => {
							if (!attributeSet.has(fieldName)) {
								attributeList.push(fieldName);
								attributeSet.add(fieldName);
							}
						});
					}

					if (callback) {
						callback(attributeList);
					}
				};

				await super.getSelectAttributeList(newCallback);
			}

			_loadListLayout(callback) {
				super._loadListLayout(listLayout => {
					const promiseList = [];

					listLayout.forEach(item => {
						if (item.name.includes('.')) {
							const parts = item.name.split('.');
							const link = parts[0];
							const field = parts[1];

							if (!this._relatedCollectionTemplates[link]) {
								const relatedEntityType = this.getMetadata().get([
									'entityDefs',
									this.scope,
									'links',
									link,
									'entity',
								]);

								this._linkScopeMap[link] = relatedEntityType;
								this._relatedModelDefs[link] = [];

								if (!relatedEntityType) {
									return;
								}

								promiseList.push(
									new Promise(resolve => {
										this.getCollectionFactory().create(relatedEntityType, collection => {
											this._relatedCollectionTemplates[link] = collection;
											resolve();
										});
									}),
								);
							}

							this._relatedModelDefs[link].push(field);
						}
					});

					Promise.all(promiseList).then(() => {
						callback(listLayout);
					});
				});
			}

			buildRows(callback) {
				if (this.collection.length <= 0) {
					super.buildRows(callback);
					return;
				}

				this.wait(true);

				this.loadRelatedModels(null, () => {
					super.buildRows(callback);
				});
			}

			loadRelatedModels(models, callback) {
				if (!models) {
					models = this.collection.models;
				}

				this.loadCollections(models, collections => {
					collections.forEach(collection => {
						collection.forEach(model => {
							if (model.id in this._relatedModelsCache) {
								this._relatedModelsCache[model.id].set(model.attributes);
								return;
							}

							this._relatedModelsCache[model.id] = model;
						});
					});

					models.forEach(model => this.prepareModel(model));

					if (typeof callback === 'function') {
						callback();
					}
				});
			}

			getAttributeListForLink(link) {
				if (this._relatedAttributesCache[link]) {
					return this._relatedAttributesCache[link];
				}

				const list = [];

				this._relatedModelDefs[link].forEach(field => {
					const linkScope = this._linkScopeMap[link];
					const fieldType = this.getMetadata().get(['entityDefs', linkScope, 'fields', field, 'type']);

					if (!fieldType) {
						return;
					}

					this.getFieldManager()
						.getEntityTypeFieldAttributeList(linkScope, field)
						.forEach(attribute => {
							list.push(attribute);
						});
				});

				this._relatedAttributesCache[link] = list;
				return list;
			}

			loadCollections(models, callback) {
				const promiseList = [];
				const relatedCollections = [];

				for (const [link, collection] of Object.entries(this._relatedCollectionTemplates)) {
					const relatedIds = {};

					models.forEach(model => {
						const id = model.get(link + 'Id');

						if (id) {
							relatedIds[id] = true;
						}
					});

					const idList = Object.keys(relatedIds);

					if (!idList.length) {
						continue;
					}

					collection.where = [
						{
							type: 'in',
							field: 'id',
							value: idList,
						},
					];

					collection.data.select = this.getAttributeListForLink(link);
					collection.maxSize = 200;

					relatedCollections.push(collection);
					promiseList.push(collection.fetch());
				}

				Promise.all(promiseList).then(() => {
					callback(relatedCollections);
				});
			}

			prepareModel(model) {
				model.defs = Espo.Utils.cloneDeep(model.defs);

				Object.entries(this._relatedModelDefs).forEach(([link, fields]) => {
					const relatedId = model.get(link + 'Id');
					const relatedModel = this._relatedModelsCache[relatedId] || false;

					if (!relatedId || !relatedModel) {
						return;
					}

					fields.forEach(field => {
						model.defs.fields[link + '.' + field] = relatedModel.defs.fields[field];
						model.defs.links[link + '.' + field] = relatedModel.defs.links[field];
					});

					const setAttributes = (attributes, o) => {
						const relatedAttributes = this.getAttributeListForLink(link);
						const attrs = {};

						Object.entries(attributes).forEach(([field, val]) => {
							if (relatedAttributes.includes(field)) {
								attrs[link + '.' + field] = val;
							}
						});

						model.set(attrs, o);
					};

					this.listenTo(relatedModel, 'change', (relatedModel, o) => {
						setAttributes(relatedModel.changedAttributes(), o);
					});

					setAttributes(relatedModel.getClonedAttributes());
				});

				const orgSync = model.sync;

				model.sync = (method, model, options) => {
					if (!['create', 'patch', 'update'].includes(method)) {
						return orgSync.call(model, method, model, options);
					}

					const attrs = Espo.Utils.clone(options.attrs || model.attributes);
					const relatedModelsAttrs = {};

					Object.entries(attrs).forEach(([key, value]) => {
						if (key.includes('.')) {
							const parts = key.split('.');
							const link = parts[0];
							const field = parts[1];

							(relatedModelsAttrs[link] || (relatedModelsAttrs[link] = {}))[field] = value;
							delete attrs[key];
						}
					});

					options.attrs = attrs;
					const deferredList = [];

					if (Object.keys(options.attrs).length !== 0) {
						deferredList.push(orgSync.call(model, method, model, options));
					}

					Object.entries(relatedModelsAttrs).forEach(([link, attrs]) => {
						deferredList.push(
							this._relatedModelsCache[model.get(link + 'Id')].save(attrs, { patch: true }),
						);
					});

					return $.when(...deferredList);
				};
			}

			showMoreRecords(options, collection, $list, $showMore, callback) {
				const orgFunction = super.showMoreRecords;

				if (orgFunction.length === 4) {
					callback = $showMore;
					$showMore = $list;
					$list = collection;
					collection = options;
				}

				collection = collection || this.collection;

				const initialCount = collection.length;

				const newCallback = () => {
					this.loadRelatedModels(collection.models.slice(initialCount), () => {
						this.adjustCheckboxSizes();

						if (callback) {
							callback();
						}
					});
				};

				if (orgFunction.length === 4) {
					return orgFunction.call(this, collection, $list, $showMore, newCallback);
				}

				return orgFunction.call(this, options, collection, $list, $showMore, newCallback);
			}

			_getHeaderDefs() {
				const defs = super._getHeaderDefs();
				defs.forEach(def => {
					if (def.name && def.name.includes('.')) {
						if (this.getLanguage().has(def.name, 'relatedFields', this.collection.entityType)) {
							def.label = this.translate(def.name, 'relatedFields', this.collection.entityType);
						} else if (!def.hasCustomLabel) {
							const parts = def.name.split('.');
							const link = parts[0];
							const field = parts[1];
							const linkScope = this._linkScopeMap[link];

							def.label =
								this.translate(link, 'links', this.collection.entityType) +
								' > ' +
								this.translate(field, 'fields', linkScope);
						}
					}
				});

				return defs;
			}

			actionDuplicate(data) {
				data = data || {};

				const id = data.id;

				Espo.Ui.notifyWait();

				Espo.Ajax.postRequest(this.scope + '/action/getDuplicateAttributes', { id }).then(attributes => {
					Espo.Ui.notify(false);

					const url = '#' + this.scope + '/create';

					this.getRouter().dispatch(this.scope, 'create', {
						attributes: attributes,
						returnUrl: this.getRouter().getCurrentUrl(),
						options: {
							duplicateSourceId: id,
						},
					});

					this.getRouter().navigate(url, { trigger: false });
				});
			}

			/** This is the method that decides what's included */
			fetchAttributeListFromLayout() {
				const attributeList = super.fetchAttributeListFromLayout();

				const manualWorkflows = this.getHelper().getAppParam('manualWorkflows');

				if (!manualWorkflows || !Object.keys(manualWorkflows).length) {
					return attributeList;
				}

				this.listLayout.forEach((item, i) => {
					if (!item.name) {
						return;
					}

					const field = item.name;

					const fieldDefs = this.getMetadata().get(['entityDefs', this.entityType, 'fields', field]);
					const fieldType = fieldDefs?.type;
					const workflowId = fieldDefs?.workflowId;

					if (fieldType === 'button' && workflowId) {
						const conditionGroup = manualWorkflows[this.entityType].find(wf => wf.id === workflowId)
							?.dynamicLogic?.conditionGroup;

						if (conditionGroup) {
							for (const condition of conditionGroup) {
								if (condition && condition.attribute) {
									attributeList[i].push(condition.attribute);
								}
							}
						}
					}
				});

				return attributeList;
			}

			// BIG OOF
			/** @private */
			setupMassActions() {
				if (this.massActionsDisabled) {
					this.massActionList = [];
					this.checkAllResultMassActionList = [];
					this.massActionDefs = {};

					return;
				}

				if (!this.getAcl().checkScope(this.entityType, 'delete')) {
					this.removeMassAction('remove');
					this.removeMassAction('merge');
				}

				if (this.removeDisabled || this.getMetadata().get(['clientDefs', this.scope, 'massRemoveDisabled'])) {
					this.removeMassAction('remove');
				}

				if (!this.getAcl().checkScope(this.entityType, 'edit')) {
					this.removeMassAction('massUpdate');
					this.removeMassAction('merge');
				}

				if (this.getMetadata().get(['clientDefs', this.scope, 'mergeDisabled']) || this.mergeDisabled) {
					this.removeMassAction('merge');
				}

				this.massActionDefs = {
					remove: { groupIndex: 0 },
					merge: { groupIndex: 0 },
					massUpdate: { groupIndex: 0 },
					export: { groupIndex: 2 },
					follow: { groupIndex: 4 },
					unfollow: { groupIndex: 4 },
					convertCurrency: { groupIndex: 6 },
					printToPdf: { groupIndex: 8 },
					...(this.getMetadata().get(['clientDefs', 'Global', 'massActionDefs']) || {}),
					...(this.getMetadata().get(['clientDefs', this.scope, 'massActionDefs']) || {}),
				};

				const metadataMassActionList = [
					...(this.getMetadata().get(['clientDefs', 'Global', 'massActionList']) || []),
					...(this.getMetadata().get(['clientDefs', this.scope, 'massActionList']) || []),
				];

				const metadataCheckAllMassActionList = [
					...(this.getMetadata().get(['clientDefs', 'Global', 'checkAllResultMassActionList']) || []),
					...(this.getMetadata().get(['clientDefs', this.scope, 'checkAllResultMassActionList']) || []),
				];

				metadataMassActionList.forEach(item => {
					const defs =
						/** @type {Espo.Utils~ActionAccessDefs & Espo.Utils~ActionAvailabilityDefs} */
						this.massActionDefs[item] || {};

					if (
						!Espo.Utils.checkActionAvailability(this.getHelper(), defs) ||
						!Espo.Utils.checkActionAccess(this.getAcl(), this.entityType, defs)
					) {
						return;
					}

					this.massActionList.push(item);
				});

				this.checkAllResultMassActionList = this.checkAllResultMassActionList.filter(item =>
					this.massActionList.includes(item),
				);

				metadataCheckAllMassActionList.forEach(item => {
					// Changed from original
					/*if (this.collection.url !== this.entityType) {
					return;
				}*/

					if (~this.massActionList.indexOf(item)) {
						const defs =
							/** @type {Espo.Utils~ActionAccessDefs & Espo.Utils~ActionAvailabilityDefs} */
							this.massActionDefs[item] || {};

						if (
							!Espo.Utils.checkActionAvailability(this.getHelper(), defs) ||
							!Espo.Utils.checkActionAccess(this.getAcl(), this.entityType, defs)
						) {
							return;
						}

						this.checkAllResultMassActionList.push(item);
					}
				});

				metadataMassActionList.concat(metadataCheckAllMassActionList).forEach(action => {
					const defs = this.massActionDefs[action] || {};

					if (!defs.initFunction || !defs.handler) {
						return;
					}

					const viewObject = this;

					this.wait(
						new Promise(resolve => {
							Espo.loader.require(defs.handler, Handler => {
								const handler = new Handler(viewObject);

								handler[defs.initFunction].call(handler);

								resolve();
							});
						}),
					);
				});

				if (
					(this.getConfig().get('exportDisabled') && !this.getUser().isAdmin()) ||
					this.getAcl().getPermissionLevel('exportPermission') === 'no' ||
					this.getMetadata().get(['clientDefs', this.scope, 'exportDisabled']) ||
					this.exportDisabled
				) {
					this.removeMassAction('export');
				}

				if (
					this.getAcl().getPermissionLevel('massUpdatePermission') !== 'yes' ||
					this.editDisabled ||
					this.massUpdateDisabled ||
					this.getMetadata().get(['clientDefs', this.scope, 'massUpdateDisabled'])
				) {
					this.removeMassAction('massUpdate');
				}

				if (
					(!this.massFollowDisabled &&
						this.getMetadata().get(['scopes', this.entityType, 'stream']) &&
						this.getAcl().check(this.entityType, 'stream')) ||
					this.getMetadata().get(['clientDefs', this.scope, 'massFollowDisabled'])
				) {
					this.addMassAction('follow');
					this.addMassAction('unfollow', true);
				}

				if (
					!this.massPrintPdfDisabled &&
					(this.getHelper().getAppParam('templateEntityTypeList') || []).includes(this.entityType) &&
					this.getAcl().checkScope(this.entityType, 'print')
				) {
					this.addMassAction('printPdf');
				}

				if (this.options.unlinkMassAction && this.collection) {
					this.addMassAction('unlink', false, true);
				}

				if (
					!this.massConvertCurrencyDisabled &&
					!this.getMetadata().get(['clientDefs', this.scope, 'convertCurrencyDisabled']) &&
					this.getConfig().get('currencyList').length > 1 &&
					this.getAcl().checkScope(this.scope, 'edit') &&
					this.getAcl().getPermissionLevel('massUpdatePermission') === 'yes'
				) {
					const currencyFieldList = this.getFieldManager().getEntityTypeFieldList(this.entityType, {
						type: 'currency',
						acl: 'edit',
					});

					if (currencyFieldList.length) {
						this.addMassAction('convertCurrency', true);
					}
				}

				this.setupMassActionItems();

				// Changed from original
				/*if (this.collection.url !== this.entityType) {
				Espo.Utils.clone(this.checkAllResultMassActionList).forEach((item) => {
					this.removeAllResultMassAction(item);
				});
			}*/

				if (this.forcedCheckAllResultMassActionList) {
					this.checkAllResultMassActionList = Espo.Utils.clone(this.forcedCheckAllResultMassActionList);
				}

				if (this.getAcl().getPermissionLevel('massUpdatePermission') !== 'yes') {
					this.removeAllResultMassAction('remove');
				}

				Espo.Utils.clone(this.massActionList).forEach(item => {
					const propName = 'massAction' + Espo.Utils.upperCaseFirst(item) + 'Disabled';

					if (this[propName] || this.options[propName]) {
						this.removeMassAction(item);
					}
				});
			}

		},
);
