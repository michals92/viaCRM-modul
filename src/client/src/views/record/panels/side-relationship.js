define(['views/record/panels/side'], Dep => class extends Dep {
	template = 'viacrm:record/panels/side-relationship';

	actionList = [];
	
	buttonList = [];

	data() {
		const data = super.data();
		// Ensure the template never receives `undefined` for the related placeholder
		data.related = '';
		return data;
	}

	setup() {
		this.link = this.link || this.defs.link || this.panelName;

		if (!this.link) {
			throw new Error(`No link.`);
		}

		this.entityType = this.model.defs.links[this.link].entity;

		super.setup();

		// Get the foreign key field name (e.g., 'accountId' for 'account' link)
		this.foreignId = this.link + 'Id';
		this.foreignName = this.link + 'Name';

		// Initialize loading state
		this.isLoading = false;
		this.loadError = null;

		// Setup buttons similar to relationship panel
		this.setupButtons();

		// Listen for changes to the foreign key
		this.listenTo(this.model, 'change:' + this.foreignId, () => this.reloadRelatedModel());

		// Setup model after render to avoid race conditions
		this.once('after:render', () => this.setupRelatedModel());
	}

	setupButtons() {
		// Check defs for what actions are enabled
		if (!('select' in this.defs)) {
			this.defs.select = true;
		}

		// Select button with icon in buttonList
		if (this.defs.select) {
			this.buttonList.push({
				action: 'selectRelated',
				html: '<span class="fas fa-angle-up"></span>',
				title: 'Select',
				acl: 'edit',
			});
		}

		// Refresh button with icon in buttonList
		this.buttonList.push({
			action: 'refresh',
			html: '<span class="fas fa-sync"></span>',
			title: 'Refresh',
		});
	}

	setupRelatedModel() {
		// Check if we have a related ID
		const relatedId = this.model.get(this.foreignId);

		if (!relatedId) {
			this.showNoData();
			return;
		}

		// Show loading state
		this.showLoading();

		// Create a model for the related entity
		this.getModelFactory().create(this.entityType, relatedModel => {
			this.relatedModel = relatedModel;
			relatedModel.id = relatedId;

			// Fetch the related record
			relatedModel.fetch().then(() => {
				this.createRelatedView();
			}).catch(error => {
				console.error('Failed to fetch related model:', error);
				this.showError();
			});
		});
	}

	createRelatedView() {
		if (!this.relatedModel || !this.relatedModel.id) {
			this.showNoData();
			return;
		}

		// Get the layout name from the panel configuration, default to detailSmall
		const layoutName = this.defs.layout || 'detailSmall';

		// We need to use detail-middle view to avoid empty side space. But for that, we need the resulting converted layout,
		// not just the layout name - so we create a fake record/detail view and use the getGridLayout method for that.
		this.createView('relatedDetail', 'views/record/detail', {
			layoutName,
			model: this.relatedModel,
			scope: this.entityType,
			// Disable rendering and other features we don't need
			inlineEditDisabled: true,
			isReady: false,
			el: null,
			selector: null,
		}, view => {
			// Don't render the view, just use it to get the grid layout
			view.getGridLayout(layout => {
				// Clear the fake view
				this.clearView('relatedDetail');

				layout.layout = layout.layout.map(p => {
					p.additionalClasses = 'no-margin';
					return p;
				});
				
				// Use detail-middle view to avoid empty side space
				this.createView('related', 'views/record/detail-middle', {
					model: this.relatedModel,
					scope: this.entityType,
					selector: '.related-record-container',
					layoutDefs: layout,
					layoutData: {
						model: this.relatedModel,
					},
					recordHelper: this.recordHelper,
					recordViewObject: this,
				}, view => {
					view.render();
					this.hideLoading();
				});
			});
		});
	}

	reloadRelatedModel() {
		const newRelatedId = this.model.get(this.foreignId);

		// Clear the view if no related record
		if (!newRelatedId) {
			this.clearView('related');
			this.clearView('relatedDetail');
			this.relatedModel = null;
			this.showNoData();
			return;
		}

		// If it's the same ID, no need to reload
		if (this.relatedModel && this.relatedModel.id === newRelatedId) {
			return;
		}

		// Clear existing views
		this.clearView('related');
		this.clearView('relatedDetail');
		
		// Setup new model
		this.setupRelatedModel();
	}

	afterRender() {
		super.afterRender();

		// Add no-padding class to panel body
		const $panelBody = this.$el.closest('.panel').find('.panel-body');
		$panelBody.addClass('no-padding');
	}

	showLoading() {
		if (this.isRendered()) {
			this.$el.find('.related-record-container').html(
				'<div class="loading" style="padding: 7px 14px">' + 
				'<span class="fas fa-spinner fa-spin"></span> ' + 
				this.translate('Loading...') + 
				'</div>'
			);
		}
	}

	hideLoading() {
		// Loading will be replaced by the view content automatically
	}

	showNoData() {
		if (this.isRendered()) {
			this.$el.find('.related-record-container').html(
				'<div class="no-data" style="padding: 7px 14px">' + 
				this.translate('None') + 
				'</div>'
			);
		}
	}

	showError() {
		if (this.isRendered()) {
			this.$el.find('.related-record-container').html(
				'<div class="error" style="padding: 7px 14px; color: #d9534f">' + 
				this.translate('Error') + 
				'</div>'
			);
		}
	}

	// Action handlers
	actionRefresh() {
		if (this.relatedModel && this.relatedModel.id) {
			this.showLoading();
			this.relatedModel.fetch().then(() => {
				// Trigger re-render of the related view
				const relatedView = this.getView('related');
				if (relatedView) {
					relatedView.render();
				}
				this.hideLoading();
			}).catch(error => {
				console.error('Failed to refresh related model:', error);
				this.showError();
			});
		}
	}


	actionSelectRelated() {
		const viewName = this.getMetadata().get(['clientDefs', this.entityType, 'modalViews', 'select']) ||
			'views/modals/select-records';

		this.createView('dialog', viewName, {
			scope: this.entityType,
			createButton: false,
			multiple: false,
		}, view => {
			view.render();

			this.listenToOnce(view, 'select', model => {
				// Update the foreign key
				const attributes = {};
				attributes[this.foreignId] = model.id;
				attributes[this.foreignName] = model.get('name');
				
				this.model.save(attributes, {patch: true});
			});
		});
	}
});
