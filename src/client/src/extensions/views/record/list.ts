import type ListRecordView from 'espocrm/src/views/record/list';
import type Model from 'espocrm/src/model';
import type Collection from 'espocrm/src/collection';

interface ColorizeHelper {
	applyColorsToRows(view: unknown, collection: unknown, entityType: string): void;
	applyColorToRow(view: unknown, color: string | null, id: string): void;
	getColor(model: unknown, entityType: string, view: unknown): string | null;
	getWatchedFields(entityType: string): string[];
}

interface ColorizeHelperConstructor {
	new(metadata: unknown, user: unknown): ColorizeHelper;
}

interface LayoutItem {
	name: string;
	isEditable?: boolean;
	breakText?: boolean;
	[key: string]: unknown;
}

interface ConvertedLayoutItem {
	name: string;
	columnName: string;
	view?: string;
	options: {
		labelText?: string;
		listEditDisabled?: boolean;
		defs: {
			breakText?: boolean;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

interface SyncOptions {
	attrs?: Record<string, unknown>;
	[key: string]: unknown;
}

interface MassActionDefs {
	groupIndex?: number;
	initFunction?: string;
	handler?: string;
	[key: string]: unknown;
}

interface ListActionData {
	id?: string;
	name?: string;
}

extend<ListRecordView>(
	['viacrm:helpers/colorize'],
	(Dep, ColorizeHelper: ColorizeHelperConstructor) =>
		class extends Dep {
			_internalLayoutType: string = 'viacrm:list-row';

			disableQuickViewContextMenu: boolean = false;

			_relatedCollectionTemplates: Record<string, Collection> = {};
			_relatedModelDefs: Record<string, string[]> = {};
			_linkScopeMap: Record<string, string> = {};
			_relatedAttributesCache: Record<string, string[]> = {};
			_relatedModelsCache: Record<string, Model> = {};

			colorizeHelper!: ColorizeHelper;

			override setup(): void {
				this.disableQuickViewContextMenu = !!this.options.disableQuickViewContextMenu;

				super.setup();

				this.colorizeHelper = new ColorizeHelper(this.getMetadata(), this.getUser());

				this.listenTo(this.collection, 'sync', () => {
					setTimeout(() => {
						this.colorizeHelper.applyColorsToRows(this, this.collection, this.entityType || this.scope);
					}, 100);
				});
			}

			massActionMerge(): false | void {
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

			actionQuickEdit(data: ListActionData): void {
				const originalCreateView = this.createView;

				this.createView = function (key: string, viewName: string, options?: Record<string, unknown>, ...args: unknown[]) {
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

			override afterRender(): void {
				super.afterRender();
				this.adjustCheckboxSizes();
				this.colorizeHelper.applyColorsToRows(this, this.collection, this.entityType || this.scope);
				this.setupDropdownPositioning();
			}

			setupDropdownPositioning(): void {
				// Position dropdown menus when they open
				this.$el.on('shown.bs.dropdown', 'tr', (e: JQuery.TriggeredEvent) => {
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
						left: toggleRect.right - ($dropdown.outerWidth() ?? 0) + 'px',
						position: 'fixed',
					});
				});

				// Clean up on close
				this.$el.on('hidden.bs.dropdown', 'tr', (e: JQuery.TriggeredEvent) => {
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
			override buildRow(i: number, model: Model, callback?: (view: unknown) => void): void {
				const entityType = this.entityType || this.scope;

				const color = this.colorizeHelper.getColor(model, entityType, this);

				super.buildRow(i, model, (view: unknown) => {
					// Apply color to the row view after it's created
					this.colorizeHelper.applyColorToRow(view, color, model.id);

					if (callback) callback(view);
				});
			}

			adjustCheckboxSizes(): void {
				const listCheckboxSize = this.getPreferences().get('listCheckboxSize');

				if (!listCheckboxSize) {
					return;
				}

				const className = 'checkbox-' + listCheckboxSize;

				const $checkboxes = this.$el.find('.record-checkbox-container > .form-checkbox-small');
				$checkboxes.each((_: number, el: HTMLElement) => {
					const $el = $(el);
					$el.addClass(className);
				});

				const $selectAllCheckbox = this.$el.find('.select-all-container > .form-checkbox-small');
				$selectAllCheckbox.addClass(className);
			}

			_convertLayout(listLayout: LayoutItem[], model?: Model): ConvertedLayoutItem[] {
				const layout: ConvertedLayoutItem[] = super._convertLayout(listLayout, model);

				const listLayoutObj: Record<string, LayoutItem> = {};

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
						const templateModel = new (this._relatedCollectionTemplates[link] as unknown as { model: new() => Model }).model();
						const type = templateModel.getFieldType(field) || 'base';

						item.name = item.name.replace('.', '_') + 'Related';
						item.view =
							templateModel.getFieldParam(field, 'view') as string || this.getFieldManager().getViewName(type);
						item.options.labelText = this.translate(field, 'fields', templateModel.name);
					}

					if (columnName in listLayoutObj) {
						item.options.listEditDisabled = !listLayoutObj[columnName].isEditable;
						item.options.defs.breakText = listLayoutObj[columnName].breakText;
					}
				});

				return layout;
			}

			override async getSelectAttributeList(callback?: (attributeList: string[]) => void): Promise<void> {
				const newCallback = (attributeList: string[]) => {
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

			override _loadListLayout(callback: (listLayout: LayoutItem[]) => void): void {
				super._loadListLayout((listLayout: LayoutItem[]) => {
					const promiseList: Promise<void>[] = [];

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
										this.getCollectionFactory().create(relatedEntityType, (collection: Collection) => {
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

			override buildRows(callback?: () => void): void {
				if (this.collection.length <= 0) {
					super.buildRows(callback);
					return;
				}

				this.wait(true);

				this.loadRelatedModels(null, () => {
					super.buildRows(callback);
				});
			}

			loadRelatedModels(models: Model[] | null, callback?: () => void): void {
				if (!models) {
					models = this.collection.models;
				}

				this.loadCollections(models, (collections: Collection[]) => {
					collections.forEach(collection => {
						collection.forEach((model: Model) => {
							if (model.id in this._relatedModelsCache) {
								this._relatedModelsCache[model.id].set(model.attributes);
								return;
							}

							this._relatedModelsCache[model.id] = model;
						});
					});

					models!.forEach(model => this.prepareModel(model));

					if (typeof callback === 'function') {
						callback();
					}
				});
			}

			getAttributeListForLink(link: string): string[] {
				if (this._relatedAttributesCache[link]) {
					return this._relatedAttributesCache[link];
				}

				const list: string[] = [];

				this._relatedModelDefs[link].forEach(field => {
					const linkScope = this._linkScopeMap[link];
					const fieldType = this.getMetadata().get(['entityDefs', linkScope, 'fields', field, 'type']);

					if (!fieldType) {
						return;
					}

					this.getFieldManager()
						.getEntityTypeFieldAttributeList(linkScope, field)
						.forEach((attribute: string) => {
							list.push(attribute);
						});
				});

				this._relatedAttributesCache[link] = list;
				return list;
			}

			loadCollections(models: Model[], callback: (collections: Collection[]) => void): void {
				const promiseList: JQuery.Promise<unknown>[] = [];
				const relatedCollections: Collection[] = [];

				for (const [link, collection] of Object.entries(this._relatedCollectionTemplates)) {
					const relatedIds: Record<string, boolean> = {};

					models.forEach(model => {
						const id = model.get(link + 'Id') as string | undefined;

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

			prepareModel(model: Model): void {
				model.defs = Espo.Utils.cloneDeep(model.defs);

				Object.entries(this._relatedModelDefs).forEach(([link, fields]) => {
					const relatedId = model.get(link + 'Id') as string | undefined;
					const relatedModel = relatedId ? this._relatedModelsCache[relatedId] : false;

					if (!relatedId || !relatedModel) {
						return;
					}

					fields.forEach(field => {
						model.defs.fields[link + '.' + field] = relatedModel.defs.fields[field];
						model.defs.links[link + '.' + field] = relatedModel.defs.links[field];
					});

					const setAttributes = (attributes: Record<string, unknown>, o?: unknown) => {
						const relatedAttributes = this.getAttributeListForLink(link);
						const attrs: Record<string, unknown> = {};

						Object.entries(attributes).forEach(([field, val]) => {
							if (relatedAttributes.includes(field)) {
								attrs[link + '.' + field] = val;
							}
						});

						model.set(attrs, o);
					};

					this.listenTo(relatedModel, 'change', (changedModel: Model, o: unknown) => {
						setAttributes(changedModel.changedAttributes(), o);
					});

					setAttributes(relatedModel.getClonedAttributes());
				});

				const orgSync = model.sync;

				model.sync = (method: string, syncModel: Model, options: SyncOptions) => {
					if (!['create', 'patch', 'update'].includes(method)) {
						return orgSync.call(syncModel, method, syncModel, options);
					}

					const attrs = Espo.Utils.clone(options.attrs || syncModel.attributes);
					const relatedModelsAttrs: Record<string, Record<string, unknown>> = {};

					Object.entries(attrs).forEach(([key, value]) => {
						if (key.includes('.')) {
							const parts = key.split('.');
							const linkName = parts[0];
							const fieldName = parts[1];

							(relatedModelsAttrs[linkName] || (relatedModelsAttrs[linkName] = {}))[fieldName] = value;
							delete attrs[key];
						}
					});

					options.attrs = attrs;
					const deferredList: JQuery.Deferred<unknown>[] = [];

					if (Object.keys(options.attrs).length !== 0) {
						deferredList.push(orgSync.call(syncModel, method, syncModel, options));
					}

					Object.entries(relatedModelsAttrs).forEach(([linkName, linkAttrs]) => {
						deferredList.push(
							this._relatedModelsCache[syncModel.get(linkName + 'Id') as string].save(linkAttrs, { patch: true }),
						);
					});

					return $.when(...deferredList);
				};
			}

			showMoreRecords(
				options: unknown,
				collection?: Collection,
				$list?: JQuery,
				$showMore?: JQuery,
				callback?: () => void
			): unknown {
				const orgFunction = super.showMoreRecords;

				if (orgFunction.length === 4) {
					callback = $showMore as unknown as (() => void);
					$showMore = $list;
					$list = collection as unknown as JQuery;
					collection = options as unknown as Collection;
				}

				collection = collection || this.collection;

				const initialCount = collection.length;

				const newCallback = () => {
					this.loadRelatedModels(collection!.models.slice(initialCount), () => {
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

			_getHeaderDefs(): Array<{ name?: string; label?: string; hasCustomLabel?: boolean }> {
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

			actionDuplicate(data?: ListActionData): void {
				const safeData = data || {};

				const id = safeData.id;

				Espo.Ui.notifyWait();

				Espo.Ajax.postRequest(this.scope + '/action/getDuplicateAttributes', { id }).then((attributes: Record<string, unknown>) => {
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

			setupMassActions(): void {
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
				} as Record<string, MassActionDefs>;

				const metadataMassActionList = [
					...(this.getMetadata().get(['clientDefs', 'Global', 'massActionList']) || []),
					...(this.getMetadata().get(['clientDefs', this.scope, 'massActionList']) || []),
				] as string[];

				const metadataCheckAllMassActionList = [
					...(this.getMetadata().get(['clientDefs', 'Global', 'checkAllResultMassActionList']) || []),
					...(this.getMetadata().get(['clientDefs', this.scope, 'checkAllResultMassActionList']) || []),
				] as string[];

				metadataMassActionList.forEach(item => {
					const defs = this.massActionDefs[item] || {};

					if (
						!Espo.Utils.checkActionAvailability(this.getHelper(), defs) ||
						!Espo.Utils.checkActionAccess(this.getAcl(), this.entityType, defs)
					) {
						return;
					}

					this.massActionList.push(item);
				});

				this.checkAllResultMassActionList = this.checkAllResultMassActionList.filter((item: string) =>
					this.massActionList.includes(item),
				);

				metadataCheckAllMassActionList.forEach(item => {
					if (~this.massActionList.indexOf(item)) {
						const defs = this.massActionDefs[item] || {};

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
							Espo.loader.require(defs.handler!, (Handler: new(view: unknown) => { [key: string]: () => void }) => {
								const handler = new Handler(viewObject);

								handler[defs.initFunction!].call(handler);

								resolve(undefined);
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

				if (this.forcedCheckAllResultMassActionList) {
					this.checkAllResultMassActionList = Espo.Utils.clone(this.forcedCheckAllResultMassActionList);
				}

				if (this.getAcl().getPermissionLevel('massUpdatePermission') !== 'yes') {
					this.removeAllResultMassAction('remove');
				}

				Espo.Utils.clone(this.massActionList).forEach((item: string) => {
					const propName = 'massAction' + Espo.Utils.upperCaseFirst(item) + 'Disabled';

					if (this[propName] || this.options[propName]) {
						this.removeMassAction(item);
					}
				});
			}
		},
);
