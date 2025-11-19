extend(Dep => class extends Dep {
	/**
	 * Override alterPanels to add relationship panels after all standard panels are loaded
	 * This is called after setupDefaultPanel() but before setupPanelViews()
	 */
	alterPanels() {
		// Call parent implementation first
		super.alterPanels();
		
		// Now add relationship panels from layoutData (which is already loaded by parent)
		if (this.layoutData) {
			Object.keys(this.layoutData).forEach(name => {
				const item = this.layoutData[name];

				// Skip disabled items
				if (item.disabled) {
					return;
				}

				// Check if it's a relationship link
				const linkDefs = this.getMetadata().get(`entityDefs.${this.scope}.links.${name}`) || {};

				if (linkDefs.type && ['belongsTo', 'hasOne'].includes(linkDefs.type)) {
					this.addRelationshipPanel(name, item);
				}
			});
		}
	}

	/**
	 * Add a relationship panel for single entity relationships
	 * @private
	 */
	addRelationshipPanel(name, item) {
		const scope = this.scope;
		const scopesDefs = this.getMetadata().get('scopes') || {};

		let p;

		if (typeof item === 'string' || item instanceof String) {
			p = {name: item};
		} else {
			p = Espo.Utils.clone(item || {});
		}

		p.name = p.name || name;

		if (!p.name) {
			return;
		}

		if (typeof p.order === 'undefined') {
			p.order = item.index || 5;
		}

		name = p.name;

		const links = (this.model.defs || {}).links || {};

		if (!(name in links)) {
			return;
		}

		const foreignScope = links[name].entity;

		if ((scopesDefs[foreignScope] || {}).disabled) {
			return;
		}

		if (!this.getAcl().check(foreignScope, 'read')) {
			return;
		}

		let defs = this.getMetadata().get(['clientDefs', scope, 'relationshipPanels', name]) || {};

		defs = Espo.Utils.clone(defs);

		for (const i in defs) {
			if (i in p) {
				continue;
			}

			p[i] = defs[i];
		}

		// For single relationships, use our custom view
		if (!p.view) {
			p.view = 'autocrm:views/record/panels/side-relationship';
		}

		// Set label
		if (!p.label) {
			p.label = this.translate(name, 'links', this.scope);
		}

		// Copy layout attributes
		if (item.dynamicLogicVisible) {
			p.dynamicLogicVisible = item.dynamicLogicVisible;
		}

		if (item.style) {
			p.style = item.style;
		}

		if (item.dynamicLogicStyled) {
			p.dynamicLogicStyled = item.dynamicLogicStyled;
		}

		if (item.sticked) {
			p.sticked = item.sticked;
		}

		if (this.recordHelper.getPanelStateParam(p.name, 'hidden') !== null) {
			p.hidden = this.recordHelper.getPanelStateParam(p.name, 'hidden');
		} else {
			this.recordHelper.setPanelStateParam(p.name, 'hidden', p.hidden || false);
		}

		// Set the actionsViewKey - this is required for the panel-actions view
		p.actionsViewKey = p.name + 'Actions';

		const existingPanel = this.panelList.find(panel => panel.name == p.name);

		if (existingPanel) {
			Object.assign(existingPanel, p);
		} else {
			this.panelList.push(p);
		}
	}
});