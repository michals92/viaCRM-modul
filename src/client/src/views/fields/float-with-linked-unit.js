define(['views/fields/float'], Dep => class extends Dep {
	type = 'floatWithLinkedUnit';

	detailTemplate = 'autocrm:fields/float-with-unit/detail';
	editTemplate = 'autocrm:fields/float-with-linked-unit/edit';
	listTemplate = 'autocrm:fields/float-with-unit/list';

	/**
	 * Setup field - load unit from linked entity or local field
	 */
	setup() {
		super.setup();

		this.unitFieldName = this.name + 'Unit';

		// Get configuration from field params
		this.unitField = this.params.unitField;           // e.g. "measureUnit"
		this.unitLinkName = this.params.unitLinkName;     // e.g. "product"

		if (this.unitField && this.unitLinkName) {
			// Mode 1: Load unit from linked entity
			this.setupDynamicUnitLoading();
		} else if (this.unitField && !this.unitLinkName) {
			// Mode 2: Read unit from local field on same entity
			this.setupLocalUnitReading();
		}
	}

	/**
	 * Setup local unit reading from same entity
	 */
	setupLocalUnitReading() {
		// Listen to changes in local unit field
		this.listenTo(this.model, 'change:' + this.unitField, () => {
			this.loadUnitFromLocalField();
		});

		// Initial load
		this.loadUnitFromLocalField();
	}

	/**
	 * Load unit value from local field on same entity
	 */
	loadUnitFromLocalField() {
		const unitValue = this.model.get(this.unitField);

		this.applyUnitValue(unitValue);
	}

	/**
	 * Setup dynamic unit loading from linked entity
	 */
	setupDynamicUnitLoading() {
		// Listen to changes in linked entity ID
		this.listenTo(this.model, 'change:' + this.unitLinkName + 'Id', () => {
			this.loadUnitFromLinkedEntity();
		});

		// Listen to changes in linked entity name (when selected from autocomplete)
		this.listenTo(this.model, 'change:' + this.unitLinkName + 'Name', () => {
			this.loadUnitFromLinkedEntity();
		});

		// Initial load
		this.loadUnitFromLinkedEntity();
	}

	/**
	 * Load unit value from linked entity
	 */
	loadUnitFromLinkedEntity() {
		const linkedId = this.model.get(this.unitLinkName + 'Id');

		if (!linkedId) {
			// No linked entity - clear unit
			this.model.set(this.unitFieldName, '', {silent: true});
			if (this.isRendered()) {
				this.reRender();
			}
			return;
		}

		// Try to use preloaded unit data from shared FOREIGN attribute
		// Attribute name: {linkName}{CapitalizedFieldName} (e.g., "productMeasureUnit")
		// This is shared by all floatWithLinkedUnit fields using the same link
		const sharedAttributeName = this.unitLinkName + this.capitalizeFirst(this.unitField);
		const preloadedUnit = this.model.get(sharedAttributeName);

		console.log('[FloatWithLinkedUnit] Checking preloaded unit:', {
			field: this.name,
			sharedAttributeName,
			preloadedUnit,
			allModelAttributes: this.model.attributes
		});

		if (preloadedUnit !== undefined && preloadedUnit !== null) {
			// Use preloaded data from shared FOREIGN attribute - no API call needed!
			this.applyUnitValue(preloadedUnit);
			return;
		}

		// NO FALLBACK - if not preloaded, something is wrong
		console.warn('[FloatWithLinkedUnit] Unit not preloaded for field:', this.name);
	}

	/**
	 * Capitalize first letter of string
	 * @param {string} str
	 * @returns {string}
	 */
	capitalizeFirst(str) {
		if (!str) return '';
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	/**
	 * Fetch unit value from server
	 */
	fetchLinkedEntityUnit(linkedId) {
		const linkedEntityType = this.model.getLinkParam(this.unitLinkName, 'entity');

		if (!linkedEntityType) {
			return;
		}

		// Fetch only the unit field - minimal data
		Espo.Ajax.getRequest(`${linkedEntityType}/${linkedId}`, {
			select: this.unitField,
		}).then(data => {
			this.applyUnitValue(data[this.unitField]);
		});
	}

	/**
	 * Apply unit value to field
	 */
	applyUnitValue(unitValue) {
		if (unitValue !== undefined && unitValue !== this.model.get(this.unitFieldName)) {
			this.model.set(this.unitFieldName, unitValue, {silent: true});

			if (this.isRendered()) {
				this.reRender();
			}
		}
	}

	/**
	 * Get current unit value
	 */
	getUnitFieldValue() {
		return this.model.get(this.unitFieldName) || '';
	}

	/**
	 * Data for template
	 */
	data() {
		const unitValue = this.getUnitFieldValue();

		const data = super.data();

		data.params.compact = this.model.getFieldParam(this.name, 'compact');

		return {
			...data,
			unitValue,
			unitFieldName: this.unitFieldName,
		};
	}

	/**
	 * After render - translate unit label
	 */
	afterRender() {
		super.afterRender();

		const unitValue = this.getUnitFieldValue();

		// In any mode, translate the unit label
		if (this.$el.find('.unit-value').length && unitValue) {
			const translatedValue = this.getTranslatedUnitLabel(unitValue);
			this.$el.find('.unit-value').text(translatedValue);
		}
	}

	/**
	 * Translate unit label with fallback to Global
	 */
	getTranslatedUnitLabel(unitValue) {
		if (!unitValue) return unitValue;

		let translated = this.translate(unitValue, 'units', this.model.entityType);

		if (!translated || translated === unitValue) {
			translated = this.translate(unitValue, 'units', 'Global');
		}

		return translated;
	}
});
