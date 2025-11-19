/**
 * Field Auto-Fill Helper
 * Provides auto-fill functionality for fields based on related entities.
 * Can be mixed into any field view to enable auto-fill from relations.
 * Automatically detects field type and adapts behavior accordingly.
 */
define([], () => ({
	/**
		 * Setup auto-fill functionality.
		 * Call this from your field's setup() method.
		 */
	setupAutoFill() {
		this.relations = this.params.relations || [];
		this.autoFill = this.params.autoFill || false;

		if (this.autoFill) {
			for (const relation of this.relations) {
				const relationIdField = relation + 'Id';
				this.listenTo(this.model, 'change:' + relationIdField, () => {
					this.autoFillFromRelations(true);
				});
			}

			this.once('after:render', () => {
				this.checkPrefilledRelations();
			});
		}
	},

	/**
		 * Check if field should be auto-filled on initial render
		 */
	checkPrefilledRelations() {
		if (!this.isEditMode()) {
			return;
		}

		const isFieldEmpty = this.isAutoFillFieldEmpty();

		if (!isFieldEmpty) {
			return;
		}

		for (const relation of this.relations) {
			const relationIdField = relation + 'Id';
			const relationId = this.model.get(relationIdField);

			if (relationId) {
				this.autoFillFromRelations();
				break;
			}
		}
	},

	/**
		 * Check if the field is empty (type-aware, automatically detects field type)
		 * @returns {boolean}
		 */
	isAutoFillFieldEmpty() {
		// Address field - check all address sub-fields
		if (this.type === 'address') {
			const fields = [this.streetField, this.cityField, this.stateField, this.postalCodeField];
			for (const field of fields) {
				const value = this.model.get(field);
				if (value && value.trim() !== '') {
					return false;
				}
			}
			return true;
		}

		// Currency field - check amount value
		if (this.type === 'currency') {
			const amount = this.model.get(this.name);
			return !amount || amount === 0;
		}

		// Default - simple field (varchar, int, enum, vatId, etc.)
		const value = this.model.get(this.name);
		return !value || (typeof value === 'string' && value.trim() === '');
	},

	/**
		 * Fill field from a specific relation (type-aware)
		 * @param {string} relationName - Name of the relation
		 * @param {string} entityType - Type of the related entity
		 */
	async fillFromRelation(relationName, entityType) {
		const { model, name } = this;

		const relationId = model.get(relationName + 'Id');

		if (!relationId) {
			return;
		}

		const entity = await this.getModelFactory().create(entityType);
		entity.id = relationId;

		await entity.fetch();

		// Address field - fill all address sub-fields
		if (this.type === 'address') {
			const addressData = {
				street: entity.get(name + 'Street'),
				city: entity.get(name + 'City'),
				state: entity.get(name + 'State'),
				country: entity.get(name + 'Country'),
				postalCode: entity.get(name + 'PostalCode')
			};
			model.set(this.mapAddressDataToFields(addressData));
			return;
		}

		// Default - simple field
		const value = entity.get(name);

		if (value !== undefined && value !== null) {
			model.set(name, value);
		}
	},

	/**
		 * Auto-fill from available relations
		 * @param {boolean} forceOverwrite - Force overwrite even if field has value
		 */
	async autoFillFromRelations(forceOverwrite = false) {
		if (!forceOverwrite && !this.isAutoFillFieldEmpty()) {
			return;
		}

		for (const relation of this.relations) {
			const entityType = this.getMetadata().get(['entityDefs', this.model.entityType, 'links', relation, 'entity']);
			if (!entityType) {
				continue;
			}

			const relationId = this.model.get(relation + 'Id');
			if (!relationId) {
				continue;
			}

			try {
				await this.fillFromRelation(relation, entityType);
				return;
			} catch (e) {
				console.error('[Field AutoFill] Failed to fill from relation', relation, e);
			}
		}
	}
}));
