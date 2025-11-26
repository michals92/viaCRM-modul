import type Storage from 'espocrm/src/storage';
import type FieldManager from 'espocrm/src/field-manager';
import type Metadata from 'espocrm/src/metadata';

define(
	[],
	() => class PartitionedViewHelper {
		scope: string;
		storage: Storage;
		fieldManager: FieldManager;
		metadata: Metadata;

		constructor(scope: string, storage: Storage, fieldManager: FieldManager, metadata: Metadata) {
			this.scope = scope;
			this.storage = storage;
			this.fieldManager = fieldManager;
			this.metadata = metadata;
		}

		getOptions(): string[] {
			return this.fieldManager.getEntityTypeFieldList(this.scope, {
				acl: 'read',
				type: 'enum',
			});
		}

		getActiveOption(): string {
			const key = 'partitionedView' + this.scope;

			return this.storage.get('active', key) || this.metadata.get(`scopes.${this.scope}.statusField`) || this.getOptions()[0];
		}

		saveActiveOption(option: string): void {
			const key = 'partitionedView' + this.scope;

			this.storage.set('active', key, option);
		}
	},
);
