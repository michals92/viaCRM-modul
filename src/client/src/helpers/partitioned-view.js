define(() => {
	/**
	 * @memberOf module:autocrm:helpers/partitioned-view
	 */
	class Class {
		/**
		 * @param scope {string} A scope name
		 * @param storage {module:storage.Class} Storage util
		 * @param fieldManager {module:field-manager.Class} Metadata util
		 * @param metadata {module:metadata.Class} Metadata util
		 */
		constructor(scope, storage, fieldManager, metadata) {
			this.scope = scope;
			this.storage = storage;
			this.fieldManager = fieldManager;
			this.metadata = metadata;
		}

		/**
		 * Get all possible field to partition by
		 *
		 * @public
		 * @returns {string[]}
		 */
		getOptions() {
			return this.fieldManager.getEntityTypeFieldList(this.scope, {
				acl: 'read',
				type: 'enum',
			});
		}

		/**
		 * Get active partition option
		 *
		 * @public
		 * @returns {string}
		 */
		getActiveOption() {
			const key = 'partitionedView' + this.scope;

			return this.storage.get('active', key) || this.metadata.get(`scopes.${this.scope}.statusField`) || this.getOptions()[0];
		}

		/**
		 * Save selected partition option
		 *
		 * @public
		 */
		saveActiveOption(option) {
			const key = 'partitionedView' + this.scope;

			this.storage.set('active', key, option);
		}
	}

	return Class;
});
