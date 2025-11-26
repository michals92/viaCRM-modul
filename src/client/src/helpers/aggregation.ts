import type Model from 'espocrm/src/model';
import type Storage from 'espocrm/src/storage';
import type Metadata from 'espocrm/src/metadata';
import type LayoutManager from 'espocrm/src/layout-manager';
import type FieldManager from 'espocrm/src/field-manager';

interface AggregationDef {
	types: string[];
	outputViewMap?: Record<string, string>;
	outputTypeMap?: Record<string, string>;
	outputType?: string;
}

interface AggregationItem {
	field: string;
	function: string;
}

define(
	[],
	() => class AggregationHelper {
		type: string;
		model: Model;
		scope: string;
		storage: Storage;
		metadata: Metadata;
		layoutManager: LayoutManager;
		fieldManager: FieldManager;
		aggregationDefs: Record<string, AggregationDef>;

		constructor(type: string, model: Model, storage: Storage, metadata: Metadata, layoutManager: LayoutManager, fieldManager: FieldManager) {
			this.type = type;
			this.model = model;
			this.scope = model.name;
			this.storage = storage;
			this.metadata = metadata;
			this.layoutManager = layoutManager;
			this.fieldManager = fieldManager;

			this.aggregationDefs = (this.metadata.get('aggregationFunctions') || {}) as Record<string, AggregationDef>;
		}

		getAggregationDefs(): Promise<AggregationItem[]> {
			const typeFuncMap: Record<string, string[]> = {};

			Object.entries(this.aggregationDefs).forEach(([func, defs]) => {
				defs.types.forEach(type => {
					if (!typeFuncMap[type]) {
						typeFuncMap[type] = [];
					}

					typeFuncMap[type].push(func);
				});
			});

			return new Promise(resolve => {
				this.layoutManager.get(this.scope, 'aggregationFunctions', (fields: string[]) => {
					const defs: AggregationItem[] = [];

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

		getActiveAggregationFunctions(): Record<string, unknown> {
			return this.storage.get(this.type + 'AggregationFunctions', this.scope) || {};
		}

		getFunctionViewName(field: string, func: string): string {
			const def = this.aggregationDefs[func];
			const fieldType = this.model.getFieldType(field);

			if ('outputViewMap' in def && fieldType in (def.outputViewMap || {})) {
				return def.outputViewMap![fieldType];
			}

			let outputType: string;

			if ('outputTypeMap' in def && fieldType in (def.outputTypeMap || {})) {
				outputType = def.outputTypeMap![fieldType];
			} else if ('outputType' in def) {
				outputType = def.outputType!;
			} else {
				outputType = fieldType;
			}

			return this.fieldManager.getViewName(outputType);
		}

		save(data: Record<string, unknown>): void {
			this.storage.set(this.type + 'AggregationFunctions', this.scope, data);
		}
	},
);
