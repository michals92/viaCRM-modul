define(['action-handler', 'helpers/record/create-related'], (Dep, CreateRelatedHelper) => class extends Dep {
	/**
		 * Foreign Link
		 * @abstract
		 * @type {string}
		 */
	link = '';

	/**
		 * Enable navigation to created entity (set to false to stay on current page)
		 * @type {boolean}
		 */
	enableNavigation = false;

	/**
		 * Main entity field transformations (separate from recordLists)
		 * @type {Array|Object|null}
		 * @description Field transformations for the main entity attributes.
		 * Processed separately before recordLists array transformations.
		 *
		 * Format Options:
		 * 1. Legacy Array Format (explicit field definitions only):
		 * entityFields = [
		 *   {
		 *     type: 'map' | 'static' | 'computed',
		 *     target: string,           // Target field name
		 *     source?: string,          // Source field (for type: 'map')
		 *     value?: any,              // Static value (for type: 'static')
		 *     fn?: Function             // Compute function (for type: 'computed')
		 *   }
		 * ]
		 *
		 * 2. New Object Format (with strategy support):
		 * entityFields = {
		 *   strategy: 'includeAll' | 'explicit',  // Default: 'includeAll'
		 *   exclude?: string[],                   // Fields to exclude when using 'includeAll'
		 *   fields?: Array<FieldDefinition>       // Additional field transformations
		 * }
		 *
		 * Strategies:
		 * - includeAll: Copy all model attributes, exclude specified ones (DEFAULT)
		 * - explicit: Only process fields defined in 'fields' array
		 *
		 * Field Types:
		 * - map: Maps source field to target field
		 * - static: Sets target field to a fixed value  
		 * - computed: Sets target field to result of function
		 *
		 * Examples:
		 * 
		 * // Legacy explicit format
		 * entityFields = [
		 *   { type: 'static', target: 'status', value: 'draft' },
		 *   { type: 'computed', target: 'parentType', fn: () => this.view.model.entityType },
		 *   { type: 'map', target: 'sourceId', source: 'id' }
		 * ]
		 *
		 * // New includeAll format (copies all model attributes by default)
		 * entityFields = {
		 *   strategy: 'includeAll',
		 *   exclude: ['id', 'createdAt', 'modifiedAt'],
		 *   fields: [
		 *     { type: 'static', target: 'status', value: 'draft' }
		 *   ]
		 * }
		 *
		 * // Simple includeAll (copies everything)
		 * entityFields = {}  // Uses default 'includeAll' strategy
		 */
	entityFields = null;

	/**
		 * RecordList configuration for transforming and filtering arrays
		 * @type {Object|null}
		 * @description Clean, explicit configuration for processing array fields only.
		 * Replaces legacy magic patterns with type-safe field definitions.
		 *
		 * Structure:
		 * recordLists = {
		 *   [listName]: {
		 *     sourceField: string,      // Source field name (e.g., 'itemsRecordList')
		 *     targetField: string,      // Target field name (defaults to sourceField)
		 *     strategy: string,         // 'includeAll' | 'explicit' | 'mapped'
		 *     exclude: string[],        // Fields to exclude when strategy is 'includeAll'
		 *     fields: Array<{           // Field transformation definitions
		 *       type: 'map' | 'static' | 'computed',
		 *       target: string,         // Target field name
		 *       source?: string,        // Source field (for type: 'map')
		 *       value?: any,            // Static value (for type: 'static')
		 *       fn?: Function           // Compute function (for type: 'computed')
		 *     }>,
		 *     filter?: Function         // Filter function: (item) => boolean
		 *   }
		 * }
		 *
		 * Field Types:
		 * - map: Maps source field to target field
		 * - static: Sets target field to a fixed value  
		 * - computed: Sets target field to result of function
		 *
		 * Strategies:
		 * - includeAll: Copy all fields, exclude specified ones
		 * - explicit: Only include fields listed in 'include' array
		 * - mapped: Only include fields defined in 'fields' array
		 *
		 * Examples:
		 * recordLists = {
		 *   // Simple filtering only
		 *   items: {
		 *     sourceField: 'itemsRecordList',
		 *     filter: (item) => Boolean(item.productId)
		 *   },
		 *
		 *   // Full configuration
		 *   products: {
		 *     sourceField: 'itemsRecordList',
		 *     targetField: 'productsRecordList',
		 *     strategy: 'includeAll',
		 *     exclude: ['id', 'tempData', 'internalFlag'],
		 *     fields: [
		 *       { type: 'map', target: 'itemParentId', source: 'productId' },
		 *       { type: 'map', target: 'itemParentName', source: 'productName' },
		 *       { type: 'static', target: 'status', value: 'active' },
		 *       { type: 'computed', target: 'parentType', fn: () => this.view.model.entityType + 'Item' },
		 *       { type: 'computed', target: 'totalPrice', fn: (item) => item.quantity * item.price }
		 *     ],
		 *     filter: (item) => Boolean(item.productId) && item.quantity > 0
		 *   }
		 * }
		 */

	/**
		 * Determines if the action should be visible
		 * @returns {boolean}
		 */
	isVisible() {
		return true;
	}

	actionCreateEntity() {
		const helper = new CreateRelatedHelper(this.view);

		const options = {
			afterSave: model => {
				const scope = model.entityType;
				Espo.Ui.success(this.view.translate(scope + 'Created', 'messages', scope));
				this.afterSave(this.view, model);
			},
			enableNavigation: this.enableNavigation,
		};

		if (this.enableNavigation) {
			options.returnUrl = this.view.getRouter().getCurrentUrl();
			options.returnDispatchParams = {
				controller: this.view.scope,
				action: null,
				options: {
					isReturn: true,
				},
			};
		}

		if (this.recordLists) {
			options.recordLists = this.recordLists;
		}

		if (this.entityFields) {
			options.entityFields = this.entityFields;
		}

		helper.process(this.view.model, this.link, options);
	}

	/**
		 * Hook method called after the entity is saved
		 * @param {Object} parentView - The parent view
		 * @param {Object} createdModel - The created entity model
		 */
	afterSave(_parentView, _createdModel) {}

	/**
		 * @param {string} targetStatus - The target status for the entity
		 * @returns {boolean} True if the action should be visible
		 */
	isVisibleForStatus(targetStatus) {
		const currentStatus = this.view.model.get('status');

		return currentStatus === targetStatus;
	}
});
