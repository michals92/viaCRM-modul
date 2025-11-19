define(['dynamic-logic'], function (_DynamicLogic) {
	/**
	 * Field Highlighter Helper
	 * Provides comprehensive field highlighting capabilities for EspoCRM fields
	 * with conditional styling based on dynamic logic rules
	 */
	return class FieldHighlighter {
		/**
		 * Constructor
		 * @param {Object} metadata - Metadata service
		 * @param {Object} user - User service
		 */
		constructor(metadata, user) {
			this.metadata = metadata;
			this.user = user;
			this.appliedStyles = new Map(); // Track applied styles for cleanup
		}

		/**
		 * Check if a rule should be applied to the current layout
		 * @param {Object} rule - Highlighting rule
		 * @param {string|null} layoutName - Current layout name
		 * @returns {boolean} True if rule should be applied
		 */
		isRuleApplicableToLayout(rule, layoutName) {
			// If no layout restrictions, rule applies to all layouts
			if (!rule.layouts || rule.layouts === null) {
				return true;
			}

			// Check if current layout is in the layouts array
			const isInLayoutsList = rule.layouts.includes(layoutName);

			// If negateLayouts is true, treat layouts as blacklist
			if (rule.negateLayouts === true) {
				return !isInLayoutsList;
			}

			// Default behavior: layouts is a whitelist
			return isInLayoutsList;
		}

		/**
		 * Get highlighting rules for a specific entity type and field
		 * @param {string} entityType - Entity type
		 * @param {string|null} fieldName - Field name (optional, for field-specific rules)
		 * @param {string|null} layoutName - Layout name (optional, for layout-specific rules)
		 * @returns {Array} Array of highlighting rules sorted by priority
		 */
		getHighlightingRules(entityType, fieldName = null, layoutName = null) {
			// Get global rules
			const globalRules = this.metadata.get(['colorizationDefs', 'Global', 'fieldRules']) || [];

			// Get entity rules
			const entityRules = this.metadata.get(['colorizationDefs', entityType, 'fieldRules']) || [];

			// Combine all rules
			const allRules = [...globalRules, ...entityRules];

			// Filter rules based on field name (if specified) and layout applicability
			const applicableRules = allRules.filter(rule => {
				// If fieldName is specified, only include rules that target that field
				if (fieldName) {
					const hasMatchingAttribute = this.ruleTargetsField(rule, fieldName);
					if (!hasMatchingAttribute) {
						return false;
					}
				}

				// Check if rule is applicable to current layout
				return this.isRuleApplicableToLayout(rule, layoutName);
			});

			// Sort by priority (higher priority first)
			return applicableRules.sort((a, b) => {
				const priorityA = a.priority || 0;
				const priorityB = b.priority || 0;
				return priorityB - priorityA;
			});
		}

		/**
		 * Check if a rule targets a specific field
		 * @param {Object} rule - Highlighting rule
		 * @param {string} fieldName - Field name to check
		 * @returns {boolean} True if rule targets the field
		 */
		ruleTargetsField(rule, fieldName) {
			// Check if fieldList is defined and contains the field
			if (rule.fieldList && Array.isArray(rule.fieldList)) {
				return rule.fieldList.includes(fieldName);
			}

			// Backward compatibility: check conditions if fieldList is not defined
			if (!rule.conditionGroup) return false;

			// Check if any condition in the rule references the field
			return this.conditionGroupReferencesField(rule.conditionGroup, fieldName);
		}

		/**
		 * Check if a condition group references a specific field
		 * @param {Object|Array} conditionGroup - Condition group
		 * @param {string} fieldName - Field name to check
		 * @returns {boolean} True if condition group references the field
		 */
		conditionGroupReferencesField(conditionGroup, fieldName) {
			// Handle array format
			if (Array.isArray(conditionGroup)) {
				return conditionGroup.some(condition =>
					this.conditionGroupReferencesField(condition, fieldName)
				);
			}

			// Handle object format
			if (typeof conditionGroup === 'object' && conditionGroup !== null) {
				// Check if this condition targets the field
				if (conditionGroup.attribute === fieldName) {
					return true;
				}

				// Check nested conditions
				if (conditionGroup.value && Array.isArray(conditionGroup.value)) {
					return conditionGroup.value.some(subCondition =>
						this.conditionGroupReferencesField(subCondition, fieldName)
					);
				}

				// Check nested condition groups
				if (conditionGroup.conditionGroup) {
					return this.conditionGroupReferencesField(conditionGroup.conditionGroup, fieldName);
				}
			}

			return false;
		}

		/**
		 * Get all fields that should trigger highlighting updates for an entity
		 * @param {string} entityType - Entity type
		 * @returns {Array} Array of field names that should be monitored
		 */
		getWatchedFields(entityType) {
			const watchedFields = new Set();

			// Get global rules
			const globalRules = this.metadata.get(['colorizationDefs', 'Global', 'fieldRules']) || [];
			globalRules.forEach(rule => {
				this.extractFieldReferencesFromRule(rule, watchedFields);
			});

			// Get entity rules
			const entityRules = this.metadata.get(['colorizationDefs', entityType, 'fieldRules']) || [];
			entityRules.forEach(rule => {
				this.extractFieldReferencesFromRule(rule, watchedFields);
			});

			return Array.from(watchedFields);
		}

		/**
		 * Extract field references from a highlighting rule
		 * @param {Object} rule - Highlighting rule
		 * @param {Set} fieldsSet - Set to add field names to
		 */
		extractFieldReferencesFromRule(rule, fieldsSet) {
			// Extract fields from fieldList if present
			if (rule.fieldList && Array.isArray(rule.fieldList)) {
				rule.fieldList.forEach(field => fieldsSet.add(field));
			}

			// Also extract fields from conditions
			if (!rule.conditionGroup) return;

			this.extractFieldReferencesFromConditionGroup(rule.conditionGroup, fieldsSet);
		}

		/**
		 * Recursively extract field references from condition groups
		 * @param {Object} conditionGroup - Condition group
		 * @param {Set} fieldsSet - Set to add field names to
		 */
		extractFieldReferencesFromConditionGroup(conditionGroup, fieldsSet) {
			// Handle array format (direct array of conditions)
			if (Array.isArray(conditionGroup)) {
				conditionGroup.forEach(condition => {
					this.extractFieldReferencesFromConditionGroup(condition, fieldsSet);
				});
				return;
			}

			// Handle object format
			if (typeof conditionGroup === 'object' && conditionGroup !== null) {
				// Extract field from attribute property
				if (conditionGroup.attribute) {
					fieldsSet.add(conditionGroup.attribute);
				}

				// Extract field from data.field property
				if (conditionGroup.data && conditionGroup.data.field) {
					fieldsSet.add(conditionGroup.data.field);
				}

				// Recursively process value array (for "and", "or" conditions)
				if (conditionGroup.value && Array.isArray(conditionGroup.value)) {
					conditionGroup.value.forEach(subCondition => {
						this.extractFieldReferencesFromConditionGroup(subCondition, fieldsSet);
					});
				}

				// Handle nested condition groups
				if (conditionGroup.conditionGroup) {
					this.extractFieldReferencesFromConditionGroup(conditionGroup.conditionGroup, fieldsSet);
				}
			}
		}

		/**
		 * Check if a model matches highlighting conditions
		 * @param {Object} model - Model to check
		 * @param {Object} rule - Highlighting rule
		 * @param {Object} view - View with dynamic logic instance (optional)
		 * @returns {boolean} True if rule matches
		 */
		matchesCondition(model, rule, view = null) {
			if (!rule.conditionGroup) {
				return false;
			}

			// Use existing view's dynamic logic if available
			if (view && view.dynamicLogic && typeof view.dynamicLogic.checkConditionGroup === 'function') {
				// Temporarily set the model for condition checking
				const originalModel = view.model;
				view.model = model;

				try {
					return view.dynamicLogic.checkConditionGroup(rule.conditionGroup);
				} finally {
					// Restore original model
					view.model = originalModel;
				}
			}

			// If we reach here without using view.dynamicLogic, return false
			return false;
		}

		/**
		 * Get field highlighting style for a model and field
		 * @param {Object} model - Model to check
		 * @param {string} entityType - Entity type
		 * @param {string} fieldName - Field name
		 * @param {Object} view - View with dynamic logic instance (optional)
		 * @param {string} layoutName - Layout name (optional)
		 * @returns {Object|null} Style object with cell and field properties or null if no rule matches
		 */
		getFieldStyle(model, entityType, fieldName, view = null, layoutName = null) {
			const rules = this.getHighlightingRules(entityType, fieldName, layoutName);
			
			for (const rule of rules) {
				const matches = this.matchesCondition(model, rule, view);
				
				if (matches) {
					if (rule.style) {
						return {
							cell: rule.style.cell || null,
							field: rule.style.field || null
						};
					}
				}
			}

			return null;
		}

		/**
		 * Apply highlighting style to a field element
		 * @param {jQuery} $element - Field element to style
		 * @param {Object} style - Style configuration
		 * @param {string} uniqueId - Unique identifier for cleanup
		 */
		applyStyleToElement($element, style, uniqueId) {
			if (!$element || !$element.length || !style) {
				return;
			}

			// Remove existing styles for this element
			this.clearElementStyles($element, uniqueId);

			const styleConfig = {
				backgroundColor: style.backgroundColor,
				color: style.color,
				border: style.border,
				borderRadius: style.borderRadius,
				fontWeight: style.fontWeight,
				fontStyle: style.fontStyle,
				textDecoration: style.textDecoration,
				boxShadow: style.boxShadow,
				...style.customCss
			};

			// Apply CSS classes if specified
			if (style.className) {
				$element.addClass(style.className);
			}

			// Apply inline styles
			Object.keys(styleConfig).forEach(property => {
				if (styleConfig[property] !== undefined && styleConfig[property] !== null) {
					$element.css(property, styleConfig[property]);
				}
			});

			// Store applied styles for cleanup
			if (!this.appliedStyles.has(uniqueId)) {
				this.appliedStyles.set(uniqueId, []);
			}
			this.appliedStyles.get(uniqueId).push({
				element: $element,
				style: styleConfig,
				className: style.className
			});
		}

		/**
		 * Clear styles from an element
		 * @param {jQuery} $element - Element to clear
		 * @param {string} uniqueId - Unique identifier
		 */
		clearElementStyles($element, uniqueId) {
			if (!this.appliedStyles.has(uniqueId)) {
				return;
			}

			const styles = this.appliedStyles.get(uniqueId);
			const remainingStyles = [];

			styles.forEach(styleData => {
				if (styleData.element.is($element)) {
					// Remove CSS classes
					if (styleData.className) {
						styleData.element.removeClass(styleData.className);
					}

					// Remove inline styles
					Object.keys(styleData.style).forEach(property => {
						styleData.element.css(property, '');
					});
				} else {
					// Keep styles that don't match this element
					remainingStyles.push(styleData);
				}
			});

			// Update the applied styles - remove the uniqueId if no styles remain
			if (remainingStyles.length > 0) {
				this.appliedStyles.set(uniqueId, remainingStyles);
			} else {
				this.appliedStyles.delete(uniqueId);
			}
		}

		/**
		 * Get layout name from a view
		 * @param {Object} view - View instance
		 * @returns {string|null} Layout name or null
		 */
		getLayoutName(view) {
			if (!view) return null;

			// Check for layout name in view options
			if (view.layoutName) {
				return view.layoutName;
			}

			// Check for layout type in view options
			if (view.options && view.options.layoutName) {
				return view.options.layoutName;
			}
			
			// Check for detail layout in options (for compare views)
			if (view.options && view.options.detailLayout) {
				return view.options.detailLayout;
			}
			
			// Check if this is a compare view
			if (view.name === 'compare' || (view.options && view.options.name === 'compare')) {
				return 'compare';
			}

			// For detail views, try to get the layout type
			if (view.type === 'detail' || view.name === 'detail') {
				// If it has a detail layout option, use that
				if (view.options && view.options.detailLayout) {
					return view.options.detailLayout;
				}
				return 'detail';
			}

			// For edit views
			if (view.type === 'edit' || view.name === 'edit') {
				return 'edit';
			}

			// For list views
			if (view.type === 'list' || view.name === 'list') {
				return 'list';
			}

			// Check parent view if current view doesn't have layout info
			const parentView = view.getParentView ? view.getParentView() : null;
			if (parentView && parentView !== view) {
				return this.getLayoutName(parentView);
			}

			return null;
		}

		/**
		 * Remove all field highlighting classes from an element
		 * @param {jQuery} $element - Element to clean
		 */
		removeAllHighlightingClasses($element) {
			if (!$element || !$element.length) {
				return;
			}

			// Get all classes on the element
			const classNames = $element.attr('class');
			if (!classNames) {
				return;
			}

			// Remove all classes that start with 'field-highlight'
			const classList = classNames.split(/\s+/);
			classList.forEach(className => {
				if (className.startsWith('field-highlight')) {
					$element.removeClass(className);
				}
			});
		}

		/**
		 * Clear field highlighting for a specific field
		 * @param {Object} fieldView - Field view instance
		 * @param {Object} model - Model
		 * @param {string} entityType - Entity type
		 * @param {Object} parentView - Parent view with dynamic logic (optional)
		 */
		clearFieldHighlighting(fieldView, _model, _entityType, _parentView = null) {
			if (!fieldView || !fieldView.$el) {
				return;
			}

			// Clear highlighting from all potential target elements using comprehensive approach
			this.clearAllHighlightingRecursively(fieldView.$el);

			// Clear cell highlighting
			const $cell = fieldView.$el.closest('.cell');
			if ($cell.length) {
				$cell.removeClass('field-cell-highlighted');
				this.removeAllHighlightingClasses($cell);
			}
		}

		/**
		 * Recursively clear all highlighting classes from an element and its children
		 * @param {jQuery} $element - Element to clear highlighting from
		 */
		clearAllHighlightingRecursively($element) {
			// Clear from the main element
			$element.removeClass('field-highlighted field-highlighted-wrapper');
			this.removeAllHighlightingClasses($element);

			// Clear from all child elements that might have highlighting
			$element.find('*').each((_index, child) => {
				const $child = $(child);
				$child.removeClass('field-highlighted field-highlighted-wrapper');
				this.removeAllHighlightingClasses($child);
			});
		}

		/**
		 * Apply field highlighting to a field view
		 * @param {Object} fieldView - Field view instance
		 * @param {Object} model - Model
		 * @param {string} entityType - Entity type
		 * @param {Object} parentView - Parent view with dynamic logic (optional)
		 * @param {string} layoutName - Layout name (optional)
		 */
		applyFieldHighlighting(fieldView, model, entityType, parentView = null, layoutName = null) {
			if (!fieldView || !fieldView.name || !fieldView.$el || !model) {
				return;
			}

			const fieldName = fieldView.name;
			
			const view = parentView || (fieldView.getParentView ? fieldView.getParentView() : null);

			// Use provided layout name consistently (don't re-detect as view context changes)
			const contextLayoutName = layoutName || this.getLayoutName(view);

			// Always clear existing highlighting first to handle dynamic changes
			this.clearFieldHighlighting(fieldView, model, entityType, parentView);

			const style = this.getFieldStyle(model, entityType, fieldName, view, contextLayoutName);

			if (style) {
				// Apply highlighting safely using classes only
				this.applyFieldHighlightingSafely(fieldView, style);
			}
		}

		/**
		 * Apply field highlighting safely without breaking field functionality
		 */
		applyFieldHighlightingSafely(fieldView, style) {
			if (!fieldView || !fieldView.$el || !style) {
				return;
			}

			// Apply field-level highlighting using a smart element targeting strategy
			if (style.field && style.field.className) {
				this.applyFieldLevelHighlighting(fieldView, style.field);
			}

			// Apply cell-level highlighting to the container
			if (style.cell && style.cell.className) {
				this.applyCellLevelHighlighting(fieldView, style.cell);
			}
		}

		/**
		 * Apply field-level highlighting with smart element targeting
		 * @param {Object} fieldView - Field view instance
		 * @param {Object} fieldStyle - Field style configuration
		 */
		applyFieldLevelHighlighting(fieldView, fieldStyle) {
			// Strategy 1: Find the most appropriate target element based on field mode and type
			const $targetElement = this.findBestTargetElement(fieldView);
			
			if ($targetElement && $targetElement.length) {
				$targetElement.addClass('field-highlighted');
				$targetElement.addClass(fieldStyle.className);
			} else {
				// Fallback: apply to main container
				fieldView.$el.addClass('field-highlighted');
				fieldView.$el.addClass(fieldStyle.className);
			}
		}

		/**
		 * Find the best target element for highlighting based on field type and mode
		 * @param {Object} fieldView - Field view instance
		 * @returns {jQuery} Best target element for highlighting
		 */
		findBestTargetElement(fieldView) {
			const mode = fieldView.mode;

			// Detail mode: Look for display elements first
			if (mode === 'detail') {
				// Priority 1: Look for semantic display elements
				const displayElements = fieldView.$el.find('.numeric-text, .text-value, .display-value, .value-text');
				if (displayElements.length) {
					return displayElements.first();
				}

				// Priority 2: Look for any span with actual content (avoiding empty spans)
				const contentSpans = fieldView.$el.find('span').filter(function() {
					return $(this).text().trim().length > 0 && !$(this).children().length;
				});
				if (contentSpans.length) {
					return contentSpans.first();
				}
			}

			// Edit mode: Look for input elements first
			if (mode === 'edit') {
				// Priority 1: Main input element
				const $mainInput = fieldView.$el.find('input.main-element, select.main-element, textarea.main-element');
				if ($mainInput.length) {
					return $mainInput;
				}

				// Priority 2: Any input/select/textarea
				const $anyInput = fieldView.$el.find('input, select, textarea').first();
				if ($anyInput.length) {
					return $anyInput;
				}
			}

			// List mode or fallback: return main container
			return fieldView.$el;
		}

		/**
		 * Apply cell-level highlighting to the container
		 * @param {Object} fieldView - Field view instance  
		 * @param {Object} cellStyle - Cell style configuration
		 */
		applyCellLevelHighlighting(fieldView, cellStyle) {
			const $cell = fieldView.$el.closest('.cell');
			if ($cell.length) {
				$cell.addClass('field-cell-highlighted');
				$cell.addClass(cellStyle.className);
			} else {
				// No cell container found, apply to field container
				fieldView.$el.addClass('field-cell-highlighted');
				fieldView.$el.addClass(cellStyle.className);
			}
		}

		/**
		 * Apply highlighting to all fields in a record view
		 * @param {Object} recordView - Record view instance
		 * @param {Object} model - Model
		 * @param {string} entityType - Entity type
		 */
		applyRecordHighlighting(recordView, model, entityType) {
			if (!recordView || !model) {
				return;
			}

			const fieldViews = recordView.getFieldViews ? recordView.getFieldViews() : {};

			// Get layout name once for all fields
			const layoutName = this.getLayoutName(recordView);
			
			Object.keys(fieldViews).forEach(fieldName => {
				const fieldView = fieldViews[fieldName];
				this.applyFieldHighlighting(fieldView, model, entityType, recordView, layoutName);
			});
		}

		/**
		 * Helper method to create a highlighting rule
		 * @param {Object} conditionGroup - Dynamic logic condition group
		 * @param {Object} style - Style configuration object with 'cell' and 'field' properties
		 * @param {number} priority - Rule priority (higher = more important)
		 * @param {Array} fieldList - Optional array of field names to apply highlighting to
		 * @returns {Object} Highlighting rule
		 */
		static createRule(conditionGroup, style, priority = 0, fieldList = null) {
			const rule = {
				conditionGroup,
				style: {
					cell: style.cell || null,
					field: style.field || null
				},
				priority
			};
			
			if (fieldList && Array.isArray(fieldList)) {
				rule.fieldList = fieldList;
			}
			
			return rule;
		}

		/**
		 * Helper method to create a rule with separate cell and field styles
		 * @param {Object} conditionGroup - Dynamic logic condition group
		 * @param {Object} cellStyle - Style configuration for the cell container
		 * @param {Object} fieldStyle - Style configuration for the field element
		 * @param {number} priority - Rule priority (higher = more important)
		 * @param {Array} fieldList - Optional array of field names to apply highlighting to
		 * @returns {Object} Highlighting rule with separate cell and field styles
		 */
		static createCellFieldRule(conditionGroup, cellStyle = null, fieldStyle = null, priority = 0, fieldList = null) {
			const rule = {
				conditionGroup,
				style: {
					cell: cellStyle,
					field: fieldStyle
				},
				priority
			};
			
			if (fieldList && Array.isArray(fieldList)) {
				rule.fieldList = fieldList;
			}
			
			return rule;
		}

		/**
		 * Helper method to create color-based styles
		 * @param {string} color - Color value (hex, rgb, etc.)
		 * @param {Object} options - Additional style options
		 * @returns {Object} Style configuration
		 */
		static createColorStyle(color, options = {}) {
			return {
				backgroundColor: color,
				color: options.textColor || this.getContrastingColor(color),
				border: options.border || `1px solid ${color}`,
				borderRadius: options.borderRadius || '4px',
				...options
			};
		}

		/**
		 * Get contrasting text color for a background color
		 * @param {string} backgroundColor - Background color
		 * @returns {string} Contrasting text color
		 */
		static getContrastingColor(backgroundColor) {
			// Simple contrast calculation - could be enhanced
			if (backgroundColor.startsWith('#')) {
				const r = parseInt(backgroundColor.substr(1, 2), 16);
				const g = parseInt(backgroundColor.substr(3, 2), 16);
				const b = parseInt(backgroundColor.substr(5, 2), 16);
				const brightness = (r * 299 + g * 587 + b * 114) / 1000;
				return brightness > 128 ? '#000000' : '#ffffff';
			}
			return '#000000'; // Default to black
		}
	};
});