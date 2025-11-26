import type CreateRelatedHelper from 'espocrm/src/helpers/record/create-related';

interface FieldDefinition {
	type: 'map' | 'static' | 'computed';
	target: string;
	source?: string;
	value?: unknown;
	fn?: (data?: unknown) => unknown;
}

interface EntityFieldsConfig {
	strategy?: 'explicit' | 'includeAll';
	fields?: FieldDefinition[];
	exclude?: string[];
}

interface RecordListConfig {
	sourceField: string;
	targetField?: string;
	strategy?: 'explicit' | 'includeAll' | 'mapped';
	exclude?: string[];
	include?: string[];
	fields?: FieldDefinition[];
	filter?: (item: unknown) => boolean;
}

interface RecordListsConfig {
	[listName: string]: RecordListConfig;
}

interface ProcessOptions {
	entityFields?: FieldDefinition[] | EntityFieldsConfig;
	recordLists?: RecordListsConfig;
	attributes?: Record<string, unknown>;
	afterSave?: (model: unknown) => void;
	enableNavigation?: boolean;
	returnUrl?: string;
	returnDispatchParams?: Record<string, unknown>;
}

interface ModelLike {
	attributes: Record<string, unknown>;
	entityType: string;
	defs: {
		links: Record<string, { entity: string; foreign: string }>;
	};
	get: (key: string) => unknown;
	has: (key: string) => boolean;
	trigger: (event: string) => void;
}

interface RecordItem {
	tempIdentifier?: string;
	id?: string;
	order?: number;
	[key: string]: unknown;
}

extend<CreateRelatedHelper>(Dep => class extends Dep {

	/**
	 * Process entityFields configuration for main entity attributes
	 */
	_processEntityFields(attributes: Record<string, unknown>, model: ModelLike, entityFields: FieldDefinition[] | EntityFieldsConfig): void {
		// Handle legacy array format or new object format with strategy
		let config: EntityFieldsConfig = {};
		let fieldDefinitions: FieldDefinition[] = [];

		if (Array.isArray(entityFields)) {
			// Legacy format: direct array of field definitions
			config = { strategy: 'explicit' };
			fieldDefinitions = entityFields;
		} else if (entityFields && typeof entityFields === 'object') {
			// New format: configuration object with strategy
			config = entityFields;
			fieldDefinitions = config.fields ?? [];
		}

		const strategy = config.strategy ?? 'includeAll';

		// Apply includeAll strategy first if specified
		if (strategy === 'includeAll') {
			// Copy all model attributes
			const modelAttributes = model.attributes ?? {};
			Object.keys(modelAttributes).forEach(field => {
				// Skip excluded fields
				if (config.exclude && Array.isArray(config.exclude) && config.exclude.includes(field)) {
					return;
				}
				// Skip fields that are already set in attributes
				if (!Object.prototype.hasOwnProperty.call(attributes, field)) {
					attributes[field] = model.get(field);
				}
			});
		}

		// Process explicit field definitions (these override includeAll)
		fieldDefinitions.forEach(fieldDef => {
			const { type, target, source, value, fn } = fieldDef;

			switch (type) {
				case 'map':
					if (source) {
						attributes[target] = model.get(source);
					}
					break;

				case 'static':
					attributes[target] = value;
					break;

				case 'computed':
					if (typeof fn === 'function') {
						try {
							const computedValue = fn.length > 0 ? fn(model) : fn();
							attributes[target] = computedValue;
						} catch (error) {
							console.error(`Error in computed entity field '${target}':`, error);
							attributes[target] = null;
						}
					}
					break;
			}
		});
	}

	/**
	 * Process recordLists configuration with new clean architecture
	 */
	_processRecordLists(attributes: Record<string, unknown>, model: ModelLike, recordLists: RecordListsConfig): void {
		Object.keys(recordLists).forEach(listName => {
			const config = recordLists[listName] as RecordListConfig;
			const sourceField = config.sourceField;
			const targetField = config.targetField ?? sourceField;
			let items = attributes[sourceField] as RecordItem[] | undefined;
			if (!items && model.get(sourceField)) {
				items = model.get(sourceField) as RecordItem[];
			}
			if (!items || !Array.isArray(items)) {
				return;
			}

			items = [...items];
			if (config.filter && typeof config.filter === 'function') {
				items = items.filter(config.filter);
			}

			items = items.map((item, index) => {
				if (typeof item !== 'object' || item === null) {
					return item;
				}

				if (item.tempIdentifier === null || item.tempIdentifier === undefined) {
					const newTempId = 'temp_' + Date.now() + '_' + index;
					item = { ...item, tempIdentifier: newTempId };
				}

				const processedItem = this._processItem(item, model, config);

				delete processedItem.id;

				return processedItem;
			});

			// CRITICAL: Check if we're appending or replacing
			if (targetField === sourceField) {
				attributes[targetField] = items;
			} else {
				// Different target field - this is where we should APPEND!
				if (attributes[targetField] && Array.isArray(attributes[targetField])) {
					// Get max order from existing items to prevent order collisions
					const existingItems = attributes[targetField] as RecordItem[];
					const maxOrder = Math.max(
						...existingItems.map(item => item.order ?? 0),
						-1
					);

					// Reindex appended items starting from maxOrder + 1
					const reindexedItems = items.map((item, index) => ({
						...item,
						order: maxOrder + 1 + index
					}));

					attributes[targetField] = [...existingItems, ...reindexedItems];
				} else {
					attributes[targetField] = items;
				}
			}
		});
	}

	/**
	 * Process individual item according to configuration
	 */
	_processItem(item: RecordItem, _model: ModelLike, config: RecordListConfig): RecordItem {
		const strategy = config.strategy ?? 'includeAll';
		let result: RecordItem = {};

		if (item.tempIdentifier !== undefined) {
			result.tempIdentifier = item.tempIdentifier;
		}

		if (strategy === 'includeAll') {
			result = { ...item };
			// Remove excluded fields
			if (config.exclude && Array.isArray(config.exclude)) {
				config.exclude.forEach(field => {
					delete result[field];
				});
			}
		} else if (strategy === 'explicit') {
			if (config.include && Array.isArray(config.include)) {
				config.include.forEach(field => {
					if (Object.prototype.hasOwnProperty.call(item, field)) {
						result[field] = item[field];
					}
				});
			}
			if (item.tempIdentifier !== undefined) {
				result.tempIdentifier = item.tempIdentifier;
			}
		} else if (strategy === 'mapped') {
			result = {};
			if (item.tempIdentifier !== undefined) {
				result.tempIdentifier = item.tempIdentifier;
			}
		}

		if (config.fields && Array.isArray(config.fields)) {
			config.fields.forEach(fieldConfig => {
				const { type, target, source, value, fn } = fieldConfig;

				switch (type) {
					case 'map':
						if (source && Object.prototype.hasOwnProperty.call(item, source)) {
							result[target] = item[source];
						}
						break;

					case 'static':
						result[target] = value;
						break;

					case 'computed':
						if (typeof fn === 'function') {
							try {
								// Function can receive item, or be parameter-less
								result[target] = fn.length > 0 ? fn(item) : fn();
							} catch (error) {
								console.error(`Error in computed field '${target}':`, error);
								result[target] = null;
							}
						}
						break;
				}
			});
		}

		return result;
	}

	/**
	 * Process standard EspoCRM createAttributeMap from metadata
	 */
	_processCreateAttributeMap(attributes: Record<string, unknown>, model: ModelLike, link: string): void {
		// Process standard EspoCRM createAttributeMap from metadata
		const attributeMap = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'createAttributeMap'
		]) as Record<string, string> ?? {};

		Object.keys(attributeMap).forEach(sourceField => {
			const targetField = attributeMap[sourceField] as string;
			if (model.has(sourceField)) {
				attributes[targetField] = model.get(sourceField);
			}
		});
	}

	/**
	 * Process enhanced entityFields from relationshipPanels configuration
	 */
	_processEntityFieldsFromMetadata(attributes: Record<string, unknown>, model: ModelLike, link: string): void {
		// Process enhanced entityFields from metadata (ViaCRM extension)
		const entityFields = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'entityFields'
		]) as FieldDefinition[] | EntityFieldsConfig | undefined;

		if (entityFields) {
			this._processEntityFields(attributes, model, entityFields);
		}
	}

	/**
	 * Process recordLists from relationshipPanels configuration
	 */
	_processRecordListsFromMetadata(attributes: Record<string, unknown>, model: ModelLike, link: string): void {
		// Process recordLists from metadata (ViaCRM extension)
		const recordLists = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'recordLists'
		]) as RecordListsConfig | undefined;

		if (recordLists && typeof recordLists === 'object') {
			this._processRecordLists(attributes, model, recordLists);
		}
	}

	/**
	 * Process entity creation with enhanced field mapping system supporting both native EspoCRM
	 * createAttributeMap and ViaCRM's advanced entityFields configuration
	 */
	override process(model: ModelLike, link: string, options: ProcessOptions = {}): void {
		const scope = model.defs['links'][link]?.entity;
		const foreignLink = model.defs['links'][link]?.foreign;

		let attributes: Record<string, unknown> = {};

		Espo.Ui.notifyWait();

		const handler = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'createHandler',
		]) as string | undefined;

		new Promise<Record<string, unknown>>(resolve => {
			if (!handler) {
				resolve({});
				return;
			}

			Espo.loader
				.requirePromise(handler)
				.then((Handler: new (helper: unknown) => { getAttributes: (model: ModelLike) => Promise<Record<string, unknown>> }) => new Handler(this.view.getHelper()))
				.then(handlerInstance => {
					handlerInstance.getAttributes(model).then(attrs => resolve(attrs));
				});
		}).then(additionalAttributes => {
			attributes = { ...attributes, ...additionalAttributes };

			// 1. Process standard EspoCRM createAttributeMap (native support)
			this._processCreateAttributeMap(attributes, model, link);

			// 2. Process entityFields from metadata (ViaCRM enhancement in relationshipPanels)
			this._processEntityFieldsFromMetadata(attributes, model, link);

			// 3. Process recordLists from metadata (ViaCRM enhancement)
			this._processRecordListsFromMetadata(attributes, model, link);

			// 4. Process entityFields from direct options (programmatic usage)
			if (options.entityFields) {
				this._processEntityFields(attributes, model, options.entityFields);
			}

			// 5. Process recordLists (ViaCRM feature)
			if (options.recordLists) {
				this._processRecordLists(attributes, model, options.recordLists);
			}

			if (options.attributes) {
				attributes = { ...attributes, ...options.attributes };
			}

			// 5. Auto-expand address fields (existing ViaCRM feature)
			Object.keys(attributes).forEach(key => {
				if (key.endsWith('Address')) {
					const addressFields = ['Street', 'City', 'State', 'Country', 'PostalCode'];
					addressFields.forEach(field => {
						const fullFieldName = `${key}${field}`;
						if (model.has(fullFieldName)) {
							attributes[fullFieldName] = model.get(fullFieldName);
						}
					});
				}
			});

			if (options.enableNavigation) {
				Espo.Ui.notify(false);

				const navOptions = {
					attributes: attributes,
					relate: {
						model: model,
						link: foreignLink,
					},
					returnUrl: options.returnUrl ?? this.view.getRouter().getCurrentUrl(),
					returnDispatchParams: options.returnDispatchParams ?? {
						controller: this.view.scope,
						action: null,
						options: {
							isReturn: true,
						},
					},
				};

				this.view.getRouter().navigate(`#${scope}/create`, { trigger: false });
				this.view.getRouter().dispatch(scope, 'create', navOptions);
			} else {
				const viewName = (this.metadata.get(['clientDefs', scope, 'modalViews', 'edit']) as string) ?? 'views/modals/edit';

				this.view.createView(
					'quickCreate',
					viewName,
					{
						scope: scope,
						relate: {
							model: model,
							link: foreignLink,
						},
						attributes: attributes,
					},
					(view: { render: () => void; notify: (val: boolean) => void; model: unknown }) => {
						view.render();
						view.notify(false);

						this.view.listenToOnce(view, 'after:save', () => {
							model.trigger(`update-related:${link}`);
							model.trigger('after:relate');
							model.trigger(`after:relate:${link}`);
							if (options.afterSave) {
								options.afterSave(view.model);
							}
						});
					},
				);
			}
		});
	}
});
