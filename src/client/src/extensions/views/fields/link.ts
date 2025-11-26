import type Model from 'espocrm/src/model';

import type LinkFieldView from 'espocrm/src/views/fields/link';

type AutoPopulateConfig = {
	mapping?: Record<string, string>;
	conditionGroup?: unknown[];
};

extend<LinkFieldView>(['ui/autocomplete'], (Dep, Autocomplete) => class extends Dep {
	override editTemplate = 'viacrm:fields/link/edit';
	override listLinkTemplate = 'viacrm:fields/link/list-link';


	getSelectFilters() {
		return typeof this.params.defaultSelectFilters === 'object' && this.params.defaultSelectFilters !== null
			? this.params.defaultSelectFilters
			: {};
	}

	override afterRender() {
		const minChars = this.params.autocompleteMinChars;

		if (minChars !== undefined && minChars !== null) {
			Autocomplete.optionsOverrides ??= {};
			const prev = Autocomplete.optionsOverrides.minChars;
			Autocomplete.optionsOverrides.minChars = minChars;

			try {
				super.afterRender();
			} finally {
				Autocomplete.optionsOverrides.minChars = prev;
			}

			return;
		}

		super.afterRender();
	}

	/**
	 * Override select method to add auto-populate functionality.
	 */
	select(model: Model): Promise<void> | void {
		const result = super.select(model);

		// Get autoPopulate configuration from metadata
		const autoPopulate = this.getAutoPopulateConfig();

		if (!autoPopulate) {
			return result;
		}

		// Check conditions if defined
		if (autoPopulate.conditionGroup) {
			const conditionsMet = this.checkConditions(
				autoPopulate.conditionGroup
			);

			if (!conditionsMet) {
				return result;
			}
		}

		// Apply field mapping
		if (autoPopulate.mapping) {
			this.applyAutoPopulate(model, autoPopulate.mapping);
		}

		return result;
	}

	/**
	 * Get autoPopulate configuration from metadata.
	 * Checks both entityDefs and fieldDefs.
	 */
	private getAutoPopulateConfig(): AutoPopulateConfig | null {
		// Try entityDefs first
		let config = this.getMetadata().get([
			'entityDefs',
			this.model.entityType,
			'fields',
			this.name,
			'autoPopulate',
		]);

		// Fallback to fieldDefs if not in entityDefs
		if (!config) {
			config = this.params.autoPopulate || null;
		}

		return config;
	}

	/**
	 * Apply auto-populate mapping from selected model to current model.
	 */
	private applyAutoPopulate(selectedModel: Model, mapping: Record<string, string>): void {
		const attributes: Record<string, unknown> = {};

		Object.entries(mapping).forEach(([sourceField, targetField]) => {
			const value = selectedModel.get(sourceField);

			if (value !== undefined && value !== null) {
				attributes[targetField] = value;
			}
		});

		if (Object.keys(attributes).length > 0) {
			this.model.set(attributes);
		}
	}

	/**
	 * Check conditions using DynamicLogic.
	 * Supports parent.* attribute notation for testing parent model.
	 */
	private checkConditions(conditionGroup: unknown[]): boolean {
		if (!Array.isArray(conditionGroup)) {
			return true;
		}

		// Get record view (3 levels up: field -> row -> list -> record)
		const recordView = this.getParentView()?.getParentView()?.getParentView();

		if (!recordView || !recordView.dynamicLogic) {
			console.warn('DynamicLogic not available, skipping conditions');
			return true;
		}

		// Use existing DynamicLogic
		const dynamicLogic = recordView.dynamicLogic;
		const originalGetAttributeValue = dynamicLogic.getAttributeValue;

		// Temporarily override getAttributeValue to support parent.* notation
		dynamicLogic.getAttributeValue = (attribute: string, preSave?: boolean) => {
			// Handle parent.* notation
			if (attribute && attribute.startsWith('parent.')) {
				const parentAttribute = attribute.substring(7);
				return recordView.model ? recordView.model.get(parentAttribute) : null;
			}

			// For regular attributes, use row model
			if (attribute) {
				return this.model.get(attribute);
			}

			return originalGetAttributeValue.call(dynamicLogic, attribute, preSave);
		};

		const result = dynamicLogic.checkConditionGroup(conditionGroup);

		// Restore original method
		dynamicLogic.getAttributeValue = originalGetAttributeValue;

		return result;
	}
});
