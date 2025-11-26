define(['views/base'], Dep => class extends Dep {
	override template = 'viacrm:fields/link-multiple/record-list-row-section';

	override init() {
		this.scope = this.model.entityType || this.model.name;
		super.init();
			
		// Initialize collapse state
		this.availableModes = ['expanded']; // Always have expanded mode
		this.currentModeIndex = 0;
			
		// In edit mode, always start expanded regardless of collapse settings
		if (this.options.collapsible && this.options.mode !== 'edit') {
			const fieldCount = (this.options.listLayout || []).length;
			const threshold = this.options.collapseThreshold;
				
			// Determine available modes based on field count and threshold
			if (threshold !== null && threshold !== undefined && fieldCount > threshold) {
				this.availableModes.push('threshold'); // Add threshold mode
				this.availableModes.push('collapsed'); // Add collapsed mode
					
				// Auto-collapse to threshold mode by default when field count exceeds threshold
				this.currentModeIndex = 1; // Start with threshold mode
			} else {
				this.availableModes.push('collapsed'); // Only collapsed mode if no threshold or small field counts
			}
		}
			
		this.updateCollapseState();
	}

	override setup() {
		super.setup();

		this.wait(true);

		this.createFieldViews();

		if (this.options.mode === 'edit') {
			this.createActionButtons();
		}
			
		// Set up event handlers for collapse
		if (this.options.collapsible) {
			this.events = this.events || {};
			this.events['click [data-action="toggleCollapse"]'] = () => this.cycleCollapseMode();
		}

		this.wait(false);
	}

	createFieldViews() {
		// Field views will be created in afterRender when DOM is ready
	}

	createActionButtons() {
		if (!this.options.removeActionDisabled) {
			this.createView('removeButton', 'viacrm:views/record/row-actions/remove-cross', {
				model: this.model,
				noWrapper: true
			});
		}

		if (!this.options.duplicateActionDisabled) {
			this.createView('duplicateButton', 'viacrm:views/record/row-actions/duplicate', {
				model: this.model,
				noWrapper: true
			});
		}

		if (this.options.recordListOrderByField) {
			this.createView('sortButton', 'viacrm:views/record/row-actions/sort-magnet', {
				model: this.model,
				noWrapper: true
			});
		}

		if (!this.options.unlinkActionDisabled) {
			this.createView('unlinkButton', 'viacrm:views/record/row-actions/unlink-chain', {
				model: this.model,
				noWrapper: true
			});
		}
	}

	override data() {
		const data = super.data();

		data.scope = this.scope;
		data.checkboxes = this.options.checkboxes || false;
		data.model = this.model;
		data.mode = this.options.mode || 'detail';

		// Build field list with labels
		data.fieldList = [];
		data.visibleFieldList = [];
		data.hiddenFieldList = [];
			
		// Use the original listLayout, not converted internal layout
		const layout = this.options.listLayout || [];
			
		// Process all fields, filtering out 'name' field to avoid duplication
		layout.forEach((item, index) => {
			if (!item.name) return;
				
			// Skip 'name' field as it's already displayed in the section header
			if (item.name === 'name') return;
				
			const label = item.label || this.translate(item.name, 'fields', this.scope);
			const required = item.params?.required || this.model.getFieldParam(item.name, 'required');

			const field = {
				name: item.name,
				label: label,
				required: required,
				key: this.getFieldKey(item.name),
				link: item.link || false
			};
				
			data.fieldList.push(field);
				
			// Determine visibility based on current mode
			const currentMode = this.getCurrentMode();
				
			if (currentMode === 'expanded') {
				// Show all fields
				data.visibleFieldList.push(field);
			} else if (currentMode === 'threshold' && this.options.collapseThreshold && index < this.options.collapseThreshold) {
				// Threshold mode - show first N fields
				data.visibleFieldList.push(field);
			} else {
				// Hidden field
				data.hiddenFieldList.push(field);
			}
		});
			
		// Add collapse-related data
		data.collapsible = this.options.collapsible || false;
		data.currentMode = this.getCurrentMode();
		data.isCollapsed = data.currentMode !== 'expanded';
		data.collapseMode = data.currentMode === 'threshold' ? 'threshold' : (data.currentMode === 'collapsed' ? 'collapsed' : 'none');
		data.fieldCount = data.fieldList.length;
		data.hiddenFieldCount = data.hiddenFieldList.length;

		// Check which actions are available from options
		data.hasActions = false;

		if (this.options.mode === 'edit') {
			data.showRemove = !this.options.removeActionDisabled;
			data.showDuplicate = !this.options.duplicateActionDisabled;
			data.showSort = !!this.options.recordListOrderByField;
			data.showUnlink = !this.options.unlinkActionDisabled;

			data.hasActions = data.showRemove || data.showDuplicate || data.showSort || data.showUnlink;
		}

		return data;
	}

	override afterRender() {
		super.afterRender();

		// Create field views after DOM is ready
		this.createActualFieldViews();
	}

	createActualFieldViews() {
		const layout = this.options.listLayout || [];

		if (!layout || layout.length === 0) {
			return;
		}

		// Only create views for visible fields
		const visibleFields = this.getVisibleFields();
			
		visibleFields.forEach(item => {
			if (!item.name) return;
				
			// Skip 'name' field as it's already displayed in the section header
			if (item.name === 'name') return;
				
			const fieldContainer = this.$el.find(`.field-row[data-name="${item.name}"] .field-value > div`);
			if (fieldContainer.length === 0) return;

			const type = this.model.getFieldType(item.name) || 'base';
			const viewName = item.view || this.model.getFieldParam(item.name, 'view') ||
					this.getFieldManager().getViewName(type);

			const viewKey = this.getFieldKey(item.name);

			// Create a unique selector for this field container
			const containerId = `field-container-${item.name}-${this.model.id}`;
			fieldContainer.attr('id', containerId);

			const options = {
				selector: `#${containerId}`, // Use ID selector
				model: this.model,
				name: item.name,
				defs: {
					name: item.name,
					params: item.params || {}
				},
				mode: this.options.mode || 'detail',
				link: item.link || false,
				inlineEditDisabled: true
			};

			this.createView(viewKey, viewName, options).then(view => {
				view.render();
			});
		});
	}
		
	getVisibleFields() {
		const layout = this.options.listLayout || [];
		const currentMode = this.getCurrentMode();
			
		// Filter out 'name' field from all layouts
		const filteredLayout = layout.filter(item => item.name !== 'name');
			
		if (currentMode === 'expanded') {
			return filteredLayout;
		}
			
		if (currentMode === 'threshold' && this.options.collapseThreshold) {
			return filteredLayout.slice(0, this.options.collapseThreshold);
		}
			
		return []; // Collapsed mode - no fields visible
	}
		
	getCurrentMode() {
		if (!this.options.collapsible || !this.availableModes) {
			return 'expanded';
		}
		return this.availableModes[this.currentModeIndex] || 'expanded';
	}
		
	updateCollapseState() {
		// This method is called when mode changes
		// No need to store anything - state is calculated
	}

	getFieldKey(name) {
		return name + '-' + this.model.id;
	}
		
	cycleCollapseMode() {
		// Move to next mode
		this.currentModeIndex = (this.currentModeIndex + 1) % this.availableModes.length;
		this.updateCollapseState();
			
		// Re-render to update the view
		this.reRender();
	}
});