define(['views/admin/entity-manager/edit'], Dep => class extends Dep {
	setup() {
		super.setup();
		
		// Get the source entity type from options
		this.sourceEntityType = this.options.fromScope;
		
		if (this.sourceEntityType) {
			// Pre-fill the form with data from the source entity
			this.model.set('type', this.getMetadata().get(['scopes', this.sourceEntityType, 'type']) || 'Base');
			this.model.set('stream', this.getMetadata().get(['scopes', this.sourceEntityType, 'stream']) || false);
			
			const iconClass = this.getMetadata().get(['clientDefs', this.sourceEntityType, 'iconClass']);
			if (iconClass) {
				this.model.set('iconClass', iconClass);
			}
			
			const color = this.getMetadata().get(['clientDefs', this.sourceEntityType, 'color']);
			if (color) {
				this.model.set('color', color);
			}
		}
	}

	actionSave() {
		const originalPostRequest = Espo.Ajax.postRequest;
		const sourceEntityType = this.sourceEntityType;

		// Only intercept the createEntity request
		Espo.Ajax.postRequest = function(url, data, options) {
			if (url === 'EntityManager/action/createEntity' && sourceEntityType) {
				// Change to cloneEntity and add sourceEntityType to data
				return originalPostRequest.call(this, 'EntityManager/action/cloneEntity', {
					...data,
					sourceEntityType: sourceEntityType
				}, options);
			}
			// All other requests pass through normally
			return originalPostRequest.call(this, url, data, options);
		};
		
		// Call parent's save action
		super.actionSave();

		// Restore original function
		Espo.Ajax.postRequest = originalPostRequest;
	}
});