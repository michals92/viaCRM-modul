define(() => {
	/**
	 * @memberOf module:autocrm:helpers/aggregation
	 */
	class Class {
		/**
		 * @param type {string} View type
		 * @param model {module:model} Model
		 * @param storage {module:storage.Class} Storage util
		 * @param metadata {module:metadata.Class} Metadata util
		 * @param layoutManager {module:layout-manager.Class} Layout manager util
		 * @param fieldManager {module:field-manager.Class} Field manager util
		 */
		constructor(type, model, storage, metadata, layoutManager, fieldManager) {
			this.type = type;
			this.model = model;
			this.scope = model.name;
			this.storage = storage;
			this.metadata = metadata;
			this.layoutManager = layoutManager;
			this.fieldManager = fieldManager;

			this.aggregationDefs = this.metadata.get('aggregationFunctions') || {};
		}

		/**
		 *
		 * [
		 *   {
		 *      field: 'field1',
		 *      function: 'sum',
		 *   },
		 *   ...
		 * ]
		 *
		 * @public
		 */
		getAggregationDefs() {
			const typeFuncMap = {};

			Object.entries(this.aggregationDefs).forEach(([func, defs]) => {
				defs.types.forEach(type => {
					if (!typeFuncMap[type]) {
						typeFuncMap[type] = [];
					}

					typeFuncMap[type].push(func);
				});
			});

			return new Promise(resolve => {
				this.layoutManager.get(this.scope, 'aggregationFunctions', fields => {
					const defs = [];

					fields.forEach(field => {
						const type = this.model.getFieldType(field);

						if (!(type in typeFuncMap)) {
							return;
						}

						typeFuncMap[type].forEach(func => {
							defs.push({
								field: field,
								function: func,
							});
						});
					});

					resolve(defs);
				});
			});
		}

		/**
		 * @public
		 */
		getActiveAggregationFunctions() {
			return this.storage.get(this.type + 'AggregationFunctions', this.scope) || {};
		}

		/**
		 * @public
		 * @param field {string}
		 * @param func {string}
		 */
		getFunctionViewName(field, func) {
			const def = this.aggregationDefs[func];
			const fieldType = this.model.getFieldType(field);

			if ('outputViewMap' in def && fieldType in def.outputViewMap) {
				return def.outputViewMap[fieldType];
			}

			let outputType;

			if ('outputTypeMap' in def && fieldType in def.outputTypeMap) {
				outputType = def.outputTypeMap[fieldType];
			} else if ('outputType' in def) {
				outputType = def.outputType;
			} else {
				outputType = fieldType;
			}

			return this.fieldManager.getViewName(outputType);
		}

		/**
		 * @public
		 * @param data {object}
		 */
		save(data) {
			this.storage.set(this.type + 'AggregationFunctions', this.scope, data);
		}
	}

	return Class;
});
