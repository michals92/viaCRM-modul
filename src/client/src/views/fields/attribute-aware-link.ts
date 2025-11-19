define(['views/fields/link'], Dep =>
	/**
	 * Attribute-aware link field
	 *
	 * Generic link field that automatically loads and syncs a specific attribute from the linked entity.
	 * Extend this class and set the `attributeName` property to specify which attribute to track.
	 *
	 * @extends views/fields/link
	 *
	 * @example
	 * ```typescript
	 * // Extend for specific attribute:
	 * class WarehouseTypeAwareLink extends Dep {
	 *     attributeName = 'type';
	 * }
	 * ```
	 */
	class extends Dep {
		/**
		 * Name of the attribute to load from linked entity
		 * Override this in child classes
		 */
		attributeName: string | null = null;

		override setup(): void {
			super.setup();

			if (!this.attributeName) {
				console.warn(
					'[AttributeAwareLink] No attributeName specified, field will not function correctly'
				);
				return;
			}

			// If linked entity is already set but attribute is not, load it
			const entityId = this.model.get(this.name + 'Id');
			const attributeValue = this.model.get(this.name + this.getAttributeFieldName());

			if (entityId && !attributeValue) {
				this.loadAttribute();
			}
		}

		/**
		 * Get the field name where attribute will be stored
		 * @returns Capitalized attribute name (e.g., 'Type', 'Status')
		 */
		getAttributeFieldName(): string {
			if (!this.attributeName) {
				return '';
			}

			return this.attributeName.charAt(0).toUpperCase() + this.attributeName.slice(1);
		}

		/**
		 * Load attribute from linked entity
		 */
		loadAttribute(): void {
			const entityId = this.model.get(this.name + 'Id') as string | undefined;
			const entityType = this.foreignScope;

			if (!entityId || !entityType) {
				return;
			}

			this.getModelFactory().create(entityType, entity => {
				entity.id = entityId;

				entity.fetch().then(() => {
					if (!this.attributeName) {
						return;
					}

					const attributeValue = entity.get(this.attributeName);
					this.model.set(this.name + this.getAttributeFieldName(), attributeValue);
				});
			});
		}

		/**
		 * Override select to sync attribute when entity is selected
		 */
		override select(model: Backbone.Model): void {
			super.select(model);

			if (this.attributeName) {
				const attributeValue = model.get(this.attributeName);
				this.model.set(this.name + this.getAttributeFieldName(), attributeValue);
			}
		}
	}
);
