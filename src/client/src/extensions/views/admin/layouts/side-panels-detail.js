extend(Dep => class extends Dep {
	hasRelationships = true;

	setup() {
		super.setup();

		// Add layout selection to the data attributes
		if (!this.dataAttributeList.includes('layout')) {
			this.dataAttributeList.push('layout');
		}
		
		// We'll define the layout attribute configuration dynamically in getEditAttributesModalViewOptions
	}

	/**
	 * Get available detail-type layouts for a specific scope
	 */
	getAllDetailLayouts(scope) {
		// Base layout types from EspoCRM
		const baseTypeList = [
			'detail',
			'detailSmall',
		];
		
		// Clone the base list
		let typeList = Espo.Utils.clone(baseTypeList);
		
		// Add additional layouts for this specific scope
		const additionalLayouts = this.getMetadata().get(['clientDefs', scope, 'additionalLayouts']) || {};
		
		for (const layoutName in additionalLayouts) {
			if (additionalLayouts[layoutName]?.type === 'detail') {
				typeList.push(layoutName);
			}
		}
		
		// Filter out disabled layouts
		typeList = typeList.filter(name => !this.getMetadata()
			.get(['clientDefs', scope, 'layout' + Espo.Utils.upperCaseFirst(name) + 'Disabled']));
		
		return typeList;
	}

	/**
	 * Translate layout name - same method as in index.js
	 */
	translateLayoutName(type, scope) {
		if (this.getLanguage().get(scope, 'layouts', type)) {
			return this.getLanguage().translate(type, 'layouts', scope);
		}

		return this.getLanguage().translate(type, 'layouts', 'Admin');
	}

	/**
	 * @protected
	 * @param {Record.<string, Record>} layout
	 */
	readDataFromLayout(layout) {
		const data = this.getDataFromLayout(layout, 'sidePanels', () => {
			const panelListAll = [];
			const labels = {};
			const params = {};

			// Add default panel if enabled
			if (
				this.getMetadata().get(`clientDefs.${this.scope}.defaultSidePanel.${this.viewType}`) !== false &&
                    !this.getMetadata().get(`clientDefs.${this.scope}.defaultSidePanelDisabled`)
			) {
				panelListAll.push('default');
				labels['default'] = 'Default';
			}

			// Add single entity links (belongsTo and hasOne)
			if (this.hasRelationships) {
				this.links = {};

				/** @type {Record<string, Record>} */
				const linkDefs = this.getMetadata().get(`entityDefs.${this.scope}.links`) || {};

				Object.keys(linkDefs).forEach(link => {
					if (
						linkDefs[link].disabled ||
                            linkDefs[link].utility ||
                            linkDefs[link].layoutRelationshipsDisabled
					) {
						return;
					}

					// Only include belongsTo and hasOne relationships (single entity links)
					if (!['belongsTo', 'hasOne'].includes(linkDefs[link].type)) {
						return;
					}

					panelListAll.push(link);
					labels[link] = this.translate(link, 'links', this.scope);

					const item = {
						name: link,
						index: 5,
					};

					// Copy relationship panel attributes from metadata
					this.dataAttributeList.forEach(attribute => {
						if (attribute in item) {
							return;
						}

						const value = this.getMetadata()
							.get(['clientDefs', this.scope, 'relationshipPanels', item.name, attribute]);

						if (value === null) {
							return;
						}

						item[attribute] = value;
					});

					this.links[link] = true;
					params[item.name] = item;

					// Mark as disabled if not in current layout
					if (!(item.name in layout)) {
						item.disabled = true;
					}
				});
			}

			return {panelListAll, labels, params};
		});

		this.disabledFields = data.disabledFields;
		this.rowLayout = data.rowLayout;
		this.itemsData = data.itemsData;
	}

	fetch() {
		const layout = super.fetch();
		const newLayout = {};

		for (const name in layout) {
			// Skip disabled relationship links
			if (layout[name].disabled && this.links && this.links[name]) {
				continue;
			}

			newLayout[name] = layout[name];
		}

		return newLayout;
	}

	getEditAttributesModalViewOptions(attributes) {
		const options = super.getEditAttributesModalViewOptions(attributes);
		
		// Check if this is a relationship panel
		if (this.links && this.links[attributes.name]) {
			// Get the foreign entity type
			const linkDefs = this.getMetadata().get(['entityDefs', this.scope, 'links', attributes.name]) || {};
			const foreignScope = linkDefs.entity;
			
			if (foreignScope) {
				// Get layouts for the foreign entity
				const layoutOptions = this.getAllDetailLayouts(foreignScope);
				
				// Create translated options map
				const translatedOptions = {};
				layoutOptions.forEach(layoutName => {
					translatedOptions[layoutName] = this.translateLayoutName(layoutName, foreignScope);
				});
				
				// Define the layout attribute configuration for this specific relationship
				options.attributeDefs = options.attributeDefs || {};
				options.attributeDefs.layout = {
					type: 'enum',
					options: layoutOptions,
					default: 'detailSmall',
					translatedOptions: translatedOptions,
					tooltip: 'panelLayout',
				};
			}
		} else {
			// This is NOT a relationship panel (e.g., default panel)
			// Remove 'layout' from the attribute list
			if (options.attributeList && options.attributeList.includes('layout')) {
				options.attributeList = options.attributeList.filter(attr => attr !== 'layout');
			}
		}
		
		return options;
	}
});