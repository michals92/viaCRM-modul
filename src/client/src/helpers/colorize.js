define(['dynamic-logic'], function (DynamicLogic) {
	return class ColorizeHelper {
		/**
		 * Constructor
		 * @param {Object} metadata - Metadata service
		 * @param {Object} user - User service
		 */
		constructor(metadata, user) {
			this.metadata = metadata;
			this.user = user;
		}

		/**
		 * Get color for a model based on colorization rules
		 * @param {Object} model - Model to check
		 * @param {string} entityType - Entity type
		 * @param {Object} view - View instance
		 * @returns {string|null} - Color or null if no rule matches
		 */
		getColor(model, entityType, view) {
			const rules = this.metadata.get(['colorizationDefs', entityType, 'rules']) || [];

			for (const rule of rules) {
				if (!rule.conditionGroup || !rule.color) {
					continue;
				}

				const dynamicLogic = new DynamicLogic(
					{},
					{
						model: model,
						getUser: () => this.user,
						getHelper: () => view.getHelper(),
					},
				);

				const result = dynamicLogic.checkConditionGroup(rule.conditionGroup);

				if (result) {
					return rule.color;
				}
			}

			return null;
		}

		applyColorToRow($row, color, modelId) {
			// Remove existing style element
			const styleEl = document.getElementById('colorize-style-' + modelId);
			if (styleEl) styleEl.remove();

			if (color) {
				// Apply color directly to the row view's element
				if ($row && $row.length) {
					// Use jQuery's css method to set the background color with !important
					$row.each(function() {
						this.style.setProperty('background-color', color, 'important');
					});

					$row.find('td').each(function() {
						this.style.setProperty('background-color', color, 'important');
					});

					// Add CSS rule
					const style = document.createElement('style');
					style.id = 'colorize-style-' + modelId;
					style.innerHTML =
						'table.table > tbody > tr[data-id="' +
						modelId +
						'"] > td { background-color: ' +
						color +
						' !important; }';
					document.head.appendChild(style);
				}
			} else {
				// Remove only background-color style if no color should be applied
				if ($row && $row.length) {
					$row.each(function() {
						this.style.removeProperty('background-color');
					});

					$row.find('td').each(function() {
						this.style.removeProperty('background-color');
					});
				}
			}
		}

		getWatchedFields(entityType) {
			const watchedFields = new Set();
			const rules = this.metadata.get(['colorizationDefs', entityType, 'rules']) || [];

			rules.forEach(rule => {
				if (rule.conditionGroup) {
					this.extractFieldReferencesFromConditionGroup(rule.conditionGroup, watchedFields);
				}
			});

			return Array.from(watchedFields);
		}

		extractFieldReferencesFromConditionGroup(conditionGroup, fieldsSet) {
			if (Array.isArray(conditionGroup)) {
				conditionGroup.forEach(condition => {
					this.extractFieldReferencesFromConditionGroup(condition, fieldsSet);
				});
				return;
			}

			if (typeof conditionGroup === 'object' && conditionGroup !== null) {
				if (conditionGroup.attribute) {
					fieldsSet.add(conditionGroup.attribute);
				}

				if (conditionGroup.data && conditionGroup.data.field) {
					fieldsSet.add(conditionGroup.data.field);
				}

				if (conditionGroup.value && Array.isArray(conditionGroup.value)) {
					conditionGroup.value.forEach(subCondition => {
						this.extractFieldReferencesFromConditionGroup(subCondition, fieldsSet);
					});
				}

				if (conditionGroup.conditionGroup) {
					this.extractFieldReferencesFromConditionGroup(conditionGroup.conditionGroup, fieldsSet);
				}
			}
		}

		/**
		 * Apply colors to rows in a list view
		 * @param {Object} view - View instance
		 * @param {Object} collection - Collection of models
		 * @param {string} entityType - Entity type
		 */
		applyColorsToRows(view, collection, entityType) {
			if (!collection) {
				return;
			}

			collection.models.forEach(model => {
				const color = this.getColor(model, entityType, view);

				// Try to get the row view directly from the parent view
				const rowView = view.getView(model.id);
				let $row;

				if (rowView && rowView.$el) {
					$row = rowView.$el;
				} else {
					$row = $(view.el).find('tr[data-id="' + model.id + '"]');
				}

				if ($row && $row.length) {
					this.applyColorToRow($row, color, model.id);
				}
			});
		}
	};
});
