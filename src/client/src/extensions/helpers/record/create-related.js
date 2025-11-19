extend(Dep => class extends Dep {

	/**
	 * Process entityFields configuration for main entity attributes
	 * @param {Object} attributes - Current attributes object
	 * @param {import('model').default} model - The model
	 * @param {Array|Object} entityFields - Entity field definitions (array) or configuration object with strategy
	 * @private
	 */
	_processEntityFields(attributes, model, entityFields) {
		// Handle legacy array format or new object format with strategy
		let config = {};
		let fieldDefinitions = [];

		if (Array.isArray(entityFields)) {
			// Legacy format: direct array of field definitions
			config = { strategy: 'explicit' };
			fieldDefinitions = entityFields;
		} else if (entityFields && typeof entityFields === 'object') {
			// New format: configuration object with strategy
			config = entityFields;
			fieldDefinitions = config.fields || [];
		}

		const strategy = config.strategy || 'includeAll';

		// Apply includeAll strategy first if specified
		if (strategy === 'includeAll') {
			// Copy all model attributes
			const modelAttributes = model.attributes || {};
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
	 * @param {Object} attributes - Current attributes object
	 * @param {import('model').default} model - The model
	 * @param {Object} recordLists - RecordLists configuration
	 * @private
	 */
	_processRecordLists(attributes, model, recordLists) {
		Object.keys(recordLists).forEach(listName => {
			const config = recordLists[listName];
			const sourceField = config.sourceField;
			const targetField = config.targetField || sourceField;
			let items = attributes[sourceField];
			if (!items && model.get(sourceField)) {
				items = model.get(sourceField);
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
					const maxOrder = Math.max(
						...attributes[targetField].map(item => item.order || 0),
						-1
					);

					// Reindex appended items starting from maxOrder + 1
					const reindexedItems = items.map((item, index) => ({
						...item,
						order: maxOrder + 1 + index
					}));

					attributes[targetField] = [...attributes[targetField], ...reindexedItems];
				} else {
					attributes[targetField] = items;
				}
			}
		});
	}

	/**
	 * Process individual item according to configuration
	 * @param {Object} item - Item to process
	 * @param {import('model').default} model - The model
	 * @param {Object} config - List configuration
	 * @returns {Object} Processed item
	 * @private
	 */
	_processItem(item, _model, config) {
		const strategy = config.strategy || 'includeAll';
		let result = {};

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
	 * @param {Object} attributes - Current attributes object
	 * @param {import('model').default} model - The model
	 * @param {string} link - The foreign link name
	 * @private
	 */
	_processCreateAttributeMap(attributes, model, link) {
		// Process standard EspoCRM createAttributeMap from metadata
		const attributeMap = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'createAttributeMap'
		]) || {};

		Object.keys(attributeMap).forEach(sourceField => {
			const targetField = attributeMap[sourceField];
			if (model.has(sourceField)) {
				attributes[targetField] = model.get(sourceField);
			}
		});
	}

	/**
	 * Process enhanced entityFields from relationshipPanels configuration
	 * @param {Object} attributes - Current attributes object
	 * @param {import('model').default} model - The model
	 * @param {string} link - The foreign link name
	 * @private
	 */
	_processEntityFieldsFromMetadata(attributes, model, link) {
		// Process enhanced entityFields from metadata (AutoCRM extension)
		const entityFields = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'entityFields'
		]);

		if (entityFields) {
			this._processEntityFields(attributes, model, entityFields);
		}
	}

	/**
	 * Process recordLists from relationshipPanels configuration
	 * @param {Object} attributes - Current attributes object
	 * @param {import('model').default} model - The model
	 * @param {string} link - The foreign link name
	 * @private
	 */
	_processRecordListsFromMetadata(attributes, model, link) {
		// Process recordLists from metadata (AutoCRM extension)
		const recordLists = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'recordLists'
		]);

		if (recordLists && typeof recordLists === 'object') {
			this._processRecordLists(attributes, model, recordLists);
		}
	}

	/**
	 * Process entity creation with enhanced field mapping system supporting both native EspoCRM
	 * createAttributeMap and AutoCRM's advanced entityFields configuration
	 *
	 * @param {import('model').default} model - The source model
	 * @param {string} link - The foreign link name
	 * @param {Object} options - Configuration options
	 * @param {Array} [options.entityFields] - Main entity field transformations (direct config)
	 * @param {Object} [options.recordLists] - RecordList configuration for array processing
	 * @param {Function} [options.afterSave] - Callback after save
	 * @param {boolean} [options.enableNavigation] - If true, navigate to create page instead of modal
	 * @param {string} [options.returnUrl] - Custom return URL for navigation (defaults to current URL)
	 * @param {Object} [options.returnDispatchParams] - Custom return dispatch parameters for navigation
	 *
	 * @description
	 * This method supports three ways of configuring field mapping:
	 * 1. Standard EspoCRM createAttributeMap (metadata: clientDefs.{entity}.relationshipPanels.{link}.createAttributeMap)
	 * 2. AutoCRM entityFields in metadata (metadata: clientDefs.{entity}.relationshipPanels.{link}.entityFields)
	 * 3. Direct entityFields in options parameter (for programmatic usage)
	 *
	 * Processing order:
	 * 1. Handler attributes (if createHandler exists)
	 * 2. Standard createAttributeMap (native EspoCRM)
	 * 3. entityFields from metadata (AutoCRM extension)
	 * 4. entityFields from options (direct config)
	 * 5. recordLists processing
	 * 6. Address fields auto-expansion
	 *
	 * Navigation support:
	 * When enableNavigation is true, instead of opening a modal, the method will
	 * navigate to the entity's create page with pre-filled attributes. Custom
	 * returnUrl and returnDispatchParams can be provided, otherwise defaults are used.
	 */
	process(model, link, options = {}) {
		const scope = model.defs['links'][link].entity;
		const foreignLink = model.defs['links'][link].foreign;

		let attributes = {};

		Espo.Ui.notifyWait();

		const handler = this.metadata.get([
			'clientDefs',
			model.entityType,
			'relationshipPanels',
			link,
			'createHandler',
		]);

		new Promise(resolve => {
			if (!handler) {
				resolve({});
				return;
			}

			Espo.loader
				.requirePromise(handler)
				.then(Handler => new Handler(this.view.getHelper()))
				.then(handler => {
					handler.getAttributes(model).then(attributes => resolve(attributes));
				});
		}).then(additionalAttributes => {
			attributes = { ...attributes, ...additionalAttributes };

			// 1. Process standard EspoCRM createAttributeMap (native support)
			this._processCreateAttributeMap(attributes, model, link);

			// 2. Process entityFields from metadata (AutoCRM enhancement in relationshipPanels)
			this._processEntityFieldsFromMetadata(attributes, model, link);

			// 3. Process recordLists from metadata (AutoCRM enhancement)
			this._processRecordListsFromMetadata(attributes, model, link);

			// 4. Process entityFields from direct options (programmatic usage)
			if (options.entityFields) {
				this._processEntityFields(attributes, model, options.entityFields);
			}

			// 5. Process recordLists (AutoCRM feature)
			if (options.recordLists) {
				this._processRecordLists(attributes, model, options.recordLists);
			}

			if (options.attributes) {
				attributes = { ...attributes, ...options.attributes };
			}

			// 5. Auto-expand address fields (existing AutoCRM feature)
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
					returnUrl: options.returnUrl || this.view.getRouter().getCurrentUrl(),
					returnDispatchParams: options.returnDispatchParams || {
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
				const viewName = this.metadata.get(['clientDefs', scope, 'modalViews', 'edit']) || 'views/modals/edit';

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
					view => {
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
