define(['autocrm:helpers/field-highlighter'], function (FieldHighlighter) {
	/**
	 * Field Highlighting View Setup Handler
	 * Properly integrates field highlighting using view-setup pattern
	 */
	return class FieldHighlightingHandler {
		constructor(view) {
			this.view = view;
			// Cache for highlighting results per field
			this.highlightingCache = new Map();
			// Track watched field values to detect actual changes
			this.watchedFieldValues = {};
			// Track current highlighting state to prevent unnecessary DOM updates
			this.currentHighlightingState = new Map();
			// Store context layout name (preserved across view changes)
			this.contextLayoutName = null;
		}

		scope;

		process() {
			if (!this.view) {
				return;
			}
			if (!this.scope) {
				if (this.view.model) {
					this.scope = this.view.model.name;
				} else {
					this.scope = this.view.entityType;
				}
			}
			if (!this.scope) {
				return;
			}

			try {
				this.initializeFieldHighlighter();
				
				// Determine and store the layout name
				if (this.view.fieldHighlighter) {
					this.contextLayoutName = this.view.fieldHighlighter.getLayoutName(this.view);
				}
				
				this.setupHighlightingListeners();
				this.setupRenderHandlers();
				this.addHighlightingMethodsToView();
				
				// Initialize watched field tracking
				this.initializeWatchedFields();
			} catch (e) {
				console.error('Could not setup field highlighting for view:', e);
			}
		}
		
		/**
		 * Initialize tracking for watched fields
		 */
		initializeWatchedFields() {
			if (!this.view.model || !this.view.fieldHighlighter || !this.scope) {
				return;
			}
			
			// Get all fields that are watched by highlighting rules
			const watchedFields = this.view.fieldHighlighter.getWatchedFields(this.scope);
			
			// Store initial values of watched fields
			watchedFields.forEach(field => {
				this.watchedFieldValues[field] = this.view.model.get(field);
			});
			
		}

		/**
		 * Initialize field highlighter for this view
		 */
		initializeFieldHighlighter() {
			if (!this.view.fieldHighlighter) {
				this.view.fieldHighlighter = new FieldHighlighter(
					this.view.getMetadata(),
					this.view.getUser()
				);
			}
		}

		/**
		 * Set up intelligent field change listeners based on highlighting rules
		 */
		setupHighlightingListeners() {
			if (!this.view.fieldHighlighter || !this.scope) {
				return;
			}

			// Get fields that should trigger highlighting updates
			const watchedFields = this.view.fieldHighlighter.getWatchedFields(this.scope);

			if (watchedFields.length > 0) {
				// Create specific listeners for watched fields
				watchedFields.forEach(field => {
					this.view.listenTo(this.view.model, `change:${field}`, (_model, value) => {
						// Only invalidate cache if value actually changed
						if (this.watchedFieldValues[field] !== value) {
							this.watchedFieldValues[field] = value;
							// Invalidate cache for fields that might be affected
							this.invalidateCacheForField(field);
							// Re-apply highlighting only for affected fields
							this.applyFieldHighlightingForAffectedFields(field);
						}
					});
				});
			} else {
				// Fallback to listening to all changes if no specific rules
				this.view.listenTo(this.view.model, 'change', () => {
					// Clear entire cache on general change
					this.highlightingCache.clear();
					this.applyFieldHighlighting();
				});
			}
		}

		/**
		 * Setup render handlers to apply highlighting after rendering
		 */
		setupRenderHandlers() {
			// Listen for renders to apply highlighting
			this.view.on('after:render', () => {
				if (this.view.fieldHighlighter) {
					setTimeout(() => this.applyFieldHighlighting(), 50);
				}
			});

			// For views that have field views, also listen to field renders
			if (this.view.getFieldViews) {
				this.view.on('after:render', () => {
					setTimeout(() => this.setupFieldHighlightingForFields(), 100);
				});
			}

			// Listen for mode changes to re-setup highlighting infrastructure
			this.view.on('after:set-detail-mode', () => {
				// Don't clear cache, just re-setup fields
				setTimeout(() => {
					this.setupFieldHighlightingForFields();
				}, 100);
			});

			// Listen for cancel-specific events that might be interfering
			this.view.on('after:cancel', () => {
				// Don't clear cache, just re-setup fields
				setTimeout(() => {
					this.setupFieldHighlightingForFields();
				}, 150);
			});


			// Track pending re-application to prevent cascading calls
			let reapplyTimeout = null;
			

			// Listen for model changes with cancel-edit action
			this.view.listenTo(this.view.model, 'change', (model, options) => {
				// Skip if this is a watched field change (already handled)
				const changedAttrs = model.changedAttributes();
				if (changedAttrs) {
					const changedKeys = Object.keys(changedAttrs);
					const isWatchedChange = changedKeys.some(key => key in this.watchedFieldValues);
					if (isWatchedChange) {
						// Already handled by specific field listeners
						return;
					}
				}
				
				
				// If unset operation, only clear cache without immediate re-apply
				if (options && options.unset) {
					// Clear cache but don't re-apply immediately
					this.highlightingCache.clear();
					
					// Clear any pending timeout
					if (reapplyTimeout) {
						clearTimeout(reapplyTimeout);
					}
					
					// Schedule re-setup after all unsets complete
					reapplyTimeout = setTimeout(() => {
						this.setupFieldHighlightingForFields();
						reapplyTimeout = null;
					}, 200);
				}
				
				if (options && options.action === 'cancel-edit') {
					// Clear cache on cancel
					this.highlightingCache.clear();
					// Re-setup after model restoration
					setTimeout(() => {
						this.setupFieldHighlightingForFields();
					}, 50);
				}
			});


			// Listen for after:mode-change event
			this.view.on('after:mode-change', (mode) => {
				// Clear cache on mode change as DOM structure changes
				this.highlightingCache.clear();
				if (mode === 'detail') {
					setTimeout(() => {
						this.setupFieldHighlightingForFields();
					}, 200);
				}
			});

			this.view.on('after:set-edit-mode', () => {
				// Don't clear cache, just re-setup fields
				setTimeout(() => {
					this.setupFieldHighlightingForFields();
				}, 100);
			});

		}

		/**
		 * Apply field highlighting to all fields in this record view
		 */
		applyFieldHighlighting() {
			if (!this.view.fieldHighlighter || !this.view.model || !this.scope) {
				return;
			}

			this.view.fieldHighlighter.applyRecordHighlighting(
				this.view,
				this.view.model,
				this.scope
			);
		}

		/**
		 * Setup highlighting for individual field views
		 */
		setupFieldHighlightingForFields() {
			if (!this.view.getFieldViews || !this.view.fieldHighlighter) {
				return;
			}


			const fieldViews = this.view.getFieldViews();
			Object.keys(fieldViews).forEach(fieldName => {
				const fieldView = fieldViews[fieldName];
				this.setupFieldViewHighlighting(fieldView);
			});

		}

		/**
		 * Setup highlighting for a single field view
		 * @param {Object} fieldView - Field view instance
		 */
		setupFieldViewHighlighting(fieldView) {
			if (!fieldView || !this.view.fieldHighlighter) {
				return;
			}

			// Add highlighting methods to field view
			fieldView.applyHighlighting = () => {
				if (this.view.fieldHighlighter && this.view.model && this.scope && fieldView.name) {
					setTimeout(() => {
						// Check cache first
						const cacheKey = `${fieldView.name}-${this.contextLayoutName}`;
						const stateKey = `${fieldView.name}-${this.contextLayoutName}-${this.view.model.id || 'new'}`;
						const cachedResult = this.highlightingCache.get(cacheKey);
						
						if (cachedResult !== undefined) {
							if (cachedResult) {
								// Apply cached highlighting
								this.view.fieldHighlighter.applyFieldHighlighting(
									fieldView,
									this.view.model,
									this.scope,
									this.view,
									this.contextLayoutName
								);
								this.currentHighlightingState.set(stateKey, true);
							} else {
								// Clear highlighting when cached result says no style
								this.view.fieldHighlighter.clearFieldHighlighting(
									fieldView,
									this.view.model,
									this.scope,
									this.view
								);
								this.currentHighlightingState.set(stateKey, false);
							}
							return;
						}
						
						// Not in cache, evaluate and cache result
						const style = this.view.fieldHighlighter.getFieldStyle(
							this.view.model,
							this.scope,
							fieldView.name,
							this.view,
							this.contextLayoutName
						);
						
						// Cache the result
						this.highlightingCache.set(cacheKey, !!style);
						
						// Apply or clear highlighting based on evaluation
						if (style) {
							this.view.fieldHighlighter.applyFieldHighlighting(
								fieldView,
								this.view.model,
								this.scope,
								this.view,
								this.contextLayoutName
							);
							this.currentHighlightingState.set(stateKey, true);
						} else {
							// Clear highlighting when no style matches
							this.view.fieldHighlighter.clearFieldHighlighting(
								fieldView,
								this.view.model,
								this.scope,
								this.view
							);
							this.currentHighlightingState.set(stateKey, false);
						}
					}, 10);
				}
			};

			fieldView.clearHighlighting = () => {
				if (this.view.fieldHighlighter && this.view.model && this.scope && fieldView.name) {
					const uniqueId = `${this.scope}-${this.view.model.id || 'new'}-${fieldView.name}`;
					this.view.fieldHighlighter.clearElementStyles(fieldView.$el, uniqueId);
				}
			};

			fieldView.applyStyle = (style) => {
				if (this.view.fieldHighlighter && this.view.model && this.scope && fieldView.name) {
					const uniqueId = `${this.scope}-${this.view.model.id || 'new'}-${fieldView.name}-manual`;
					this.view.fieldHighlighter.applyStyleToElement(fieldView.$el, style, uniqueId);
				}
			};

			// Add quick helper methods
			fieldView.highlightSuccess = () => fieldView.applyStyle(FieldHighlighter.styles.success);
			fieldView.highlightWarning = () => fieldView.applyStyle(FieldHighlighter.styles.warning);
			fieldView.highlightDanger = () => fieldView.applyStyle(FieldHighlighter.styles.danger);
			fieldView.highlightInfo = () => fieldView.applyStyle(FieldHighlighter.styles.info);
			fieldView.highlightPrimary = () => fieldView.applyStyle(FieldHighlighter.styles.primary);

			fieldView.setBackgroundColor = (color) => fieldView.applyStyle({backgroundColor: color});
			fieldView.setTextColor = (color) => fieldView.applyStyle({color: color});
			fieldView.setBorder = (border) => fieldView.applyStyle({border: border});
			fieldView.makeBold = () => fieldView.applyStyle({fontWeight: 'bold'});
			fieldView.makeItalic = () => fieldView.applyStyle({fontStyle: 'italic'});

			// Apply highlighting after field renders
			fieldView.on('after:render', () => {
				fieldView.applyHighlighting();
			});

			// Apply highlighting immediately if already rendered
			if (fieldView.isRendered()) {
				setTimeout(() => fieldView.applyHighlighting(), 10);
			}
		}

		/**
		 * Add highlighting methods to the main view
		 */
		addHighlightingMethodsToView() {
			if (!this.view.fieldHighlighter) return;

			// Apply highlighting to a specific field
			this.view.highlightField = (fieldName) => {
				const fieldView = this.view.getFieldView ? this.view.getFieldView(fieldName) : null;
				if (fieldView) {
					this.view.fieldHighlighter.applyFieldHighlighting(
						fieldView,
						this.view.model,
						this.scope,
						this.view,
						this.contextLayoutName
					);
				}
			};

			// Clear highlighting from a specific field
			this.view.clearFieldHighlighting = (fieldName) => {
				const fieldView = this.view.getFieldView ? this.view.getFieldView(fieldName) : null;
				if (fieldView) {
					const uniqueId = `${this.scope}-${this.view.model.id || 'new'}-${fieldName}`;
					this.view.fieldHighlighter.clearElementStyles(fieldView.$el, uniqueId);
				}
			};

			// Manually apply a style to a field
			this.view.applyFieldStyle = (fieldName, style) => {
				const fieldView = this.view.getFieldView ? this.view.getFieldView(fieldName) : null;
				if (fieldView) {
					const uniqueId = `${this.scope}-${this.view.model.id || 'new'}-${fieldName}-manual`;
					this.view.fieldHighlighter.applyStyleToElement(fieldView.$el, style, uniqueId);
				}
			};

			// Get field highlighting style for a specific field
			this.view.getFieldHighlightStyle = (fieldName, _directRules = null) => {
				if (!this.view.model || !this.scope) {
					return null;
				}

				return this.view.fieldHighlighter.getFieldStyle(this.view.model, this.scope, fieldName, this.view, this.contextLayoutName);
			};
		}
		
		/**
		 * Invalidate cache for fields that depend on the changed field
		 * @param {string} changedField - The field that changed
		 */
		invalidateCacheForField(changedField) {
			// Get all rules that reference this field
			const affectedFields = new Set();
			
			if (this.view.fieldHighlighter && this.scope) {
				// Get all rules for this entity with the current layout
				const rules = this.view.fieldHighlighter.getHighlightingRules(this.scope, null, this.contextLayoutName);
				
				rules.forEach((rule, _index) => {
					// Check if this rule references the changed field
					if (rule.conditionGroup) {
						const referencesField = this.checkConditionReferencesField(rule.conditionGroup, changedField);
						
						if (referencesField && rule.fieldList) {
							// Add all fields from this rule's fieldList to affected fields
							rule.fieldList.forEach(field => affectedFields.add(field));
						}
					}
				});
			}
			
			// Invalidate cache for all affected fields
			affectedFields.forEach(field => {
				// Clear cache for the current layout context
				const cacheKey = `${field}-${this.contextLayoutName}`;
				this.highlightingCache.delete(cacheKey);
			});
			
		}
		
		/**
		 * Check if a condition group references a specific field
		 * @param {Object|Array} conditionGroup - The condition group to check
		 * @param {string} fieldName - The field name to look for
		 * @returns {boolean} True if the condition references the field
		 */
		checkConditionReferencesField(conditionGroup, fieldName) {
			if (Array.isArray(conditionGroup)) {
				return conditionGroup.some(condition => 
					this.checkConditionReferencesField(condition, fieldName)
				);
			}
			
			if (typeof conditionGroup === 'object' && conditionGroup !== null) {
				// Check direct field references
				if (conditionGroup.attribute === fieldName || conditionGroup.field === fieldName) {
					return true;
				}
				
				// Check nested conditions
				if (conditionGroup.value && Array.isArray(conditionGroup.value)) {
					return conditionGroup.value.some(subCondition =>
						this.checkConditionReferencesField(subCondition, fieldName)
					);
				}
				
				if (conditionGroup.conditionGroup) {
					return this.checkConditionReferencesField(conditionGroup.conditionGroup, fieldName);
				}
			}
			
			return false;
		}
		
		/**
		 * Apply highlighting only for fields affected by a changed field
		 * @param {string} changedField - The field that changed
		 */
		applyFieldHighlightingForAffectedFields(changedField) {
			if (!this.view.getFieldViews || !this.view.fieldHighlighter) {
				return;
			}
			
			// Get affected fields from invalidation
			const affectedFields = new Set();
			
			if (this.scope) {
				const rules = this.view.fieldHighlighter.getHighlightingRules(this.scope, null, this.contextLayoutName);
				rules.forEach(rule => {
					if (rule.conditionGroup && this.checkConditionReferencesField(rule.conditionGroup, changedField)) {
						if (rule.fieldList) {
							rule.fieldList.forEach(field => affectedFields.add(field));
						}
					}
				});
			}
			
			// Apply highlighting only to affected fields
			const fieldViews = this.view.getFieldViews();
			affectedFields.forEach(fieldName => {
				const fieldView = fieldViews[fieldName];
				if (fieldView && fieldView.applyHighlighting) {
					fieldView.applyHighlighting();
				}
			});
		}

	};
});