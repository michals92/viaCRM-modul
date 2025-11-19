extend(['views/admin/layouts/side-panels-detail'], (Dep, SidePanelsDetail) => class extends Dep {
	// only 1-N relations make sense for a list view in panel
	allowedLinks = ['hasMany', 'hasChildren'];
	TAB_BREAK_KEY = '_tabBreak_{n}';

	panels = {};

	setup() {
		super.setup();
		
		// Add isSystem to dataAttributesDefs so it gets rendered as data-issystem attribute
		if (!this.dataAttributesDefs) {
			this.dataAttributesDefs = {};
		}
		this.dataAttributesDefs.isSystem = {
			type: 'bool',
			default: false,
			readOnly: true
		};

		this.wait(
			new Promise(resolve => {
				this.getHelper().layoutManager.get(this.scope, 'detail', layout => {
					this.panels = layout.reduce((panels, panel, i) => {
						let label = '';
						const language = this.getLanguage();

						if (panel.label) {
							if (language.has(panel.label, 'labels', this.scope)) {
								label = language.translate(panel.label, 'labels', this.scope);
							} else {
								label = language.translate(panel.label, 'labels', 'Global');
							}
						}

						if (panel.customLabel) {
							label = panel.customLabel;
						}

						panels[i] = label;

						return panels;
					}, {});

					resolve();
				});
			}),
		);
	}

	afterRender() {
		super.afterRender();
		
		// Add visual styling to system panels
		this.addSystemPanelStyling();
	}

	addSystemPanelStyling() {
		// Wait for DOM to be ready
		setTimeout(() => {
			if (!this.itemsData) return;
			
			// Find all cells - use correct selector for enabled and disabled lists
			const cells = this.$el.find('#layout ul > li.cell');
			
			cells.each((_, element) => {
				const $cell = $(element);
				const cellName = $cell.attr('data-name');
				const isSystemFromData = $cell.attr('data-issystem') === 'true';
				const isSystemFromItemsData = this.itemsData[cellName] && this.itemsData[cellName].isSystem;
				
				if (cellName && (isSystemFromData || isSystemFromItemsData)) {
					console.log('Adding system-panel class to:', cellName);
					$cell.addClass('system-panel');
				}
			});
		}, 100);
	}

	readDataFromLayout(layout) {
		
		super.readDataFromLayout(layout);
		
		const disabledToMove = [];
		for (let i = this.disabledFields.length - 1; i >= 0; i--) {
			const panel = this.disabledFields[i];
			if (layout[panel.name] && layout[panel.name].disabled) {
				// Remove from disabledFields
				disabledToMove.push(this.disabledFields.splice(i, 1)[0]);
			}
		}
		
		for (const panel of disabledToMove) {
			panel.disabled = true;
			this.rowLayout.push(panel);
			this.itemsData[panel.name] = Espo.Utils.cloneDeep(panel);
		}

		const parentLinks = this.getMetadata().get(['entityDefs', this.scope, 'links']) || {};

		for (const link in parentLinks) {
			const parentLinkDef = parentLinks[link];
			if (
				!this.allowedLinks.includes(parentLinkDef.type) ||
					parentLinkDef.disabled ||
					parentLinkDef.layoutRelationshipsDisabled
			) {
				continue;
			}

			const scope = parentLinkDef.entity;
			const nestedLinks = this.getMetadata().get(['entityDefs', scope, 'links']) || {};

			for (const panel in nestedLinks) {
				const linkDef = nestedLinks[panel],
					panelName = link + '.' + panel;
					// these are the actual panels so the `layoutRelationshipsDisabled` check is important
				if (
					this.allowedLinks.includes(linkDef.type) &&
						!linkDef.disabled &&
						!linkDef.layoutRelationshipsDisabled
				) {
					const layoutPanel = layout[panelName];

					const label =
							this.translate(link, 'links', this.scope) +
							' > ' +
							(this.translate(panel, 'links', scope) || this.translate(panel, 'panels', scope));

					const panelData = {
						name: panelName,
						label,
						labelText: label,
					};

					if (!layoutPanel || layoutPanel.disabled) {
						this.disabledFields.push(panelData);
					} else {
						for (const attribute in this.dataAttributesDefs) {
							if (attribute === 'name') {
								continue;
							}

							if (attribute in linkDef) {
								panelData[attribute] = linkDef[attribute];
							}
						}
						for (const i in layoutPanel) {
							panelData[i] = layoutPanel[i];
						}
						this.rowLayout.push(panelData);
						this.itemsData[panelData.name] = Espo.Utils.cloneDeep(panelData);
					}
				}
			}
		}

		this.rowLayout.sort((v1, v2) => (v1.index || 0) - (v2.index || 0));
		
		for (const name in layout) {
			if (!name.includes('.') && this.itemsData[name]) {
				this.itemsData[name].disabled = layout[name].disabled;
				this.itemsData[name].isSystem = layout[name].isSystem;
			}
		}
		
		// Re-apply styling after layout changes
		this.addSystemPanelStyling();
	}

	isGenuineBottomPanel(attributes) {
		const result = !attributes.noLayout && attributes.name !== 'stream' && !this.isTabName(attributes.name);
		return result;
	}

	getEditAttributesModalViewOptions(attributes) {
		const options = SidePanelsDetail.prototype.getEditAttributesModalViewOptions.call(this, attributes);

		if (this.isTabName(attributes.name)) {
			if (!options.attributeList.includes('tabLabel')) {
				options.attributeList.unshift('tabLabel');
			}

			if (!options.attributeDefs.tabLabel) {
				options.attributeDefs.tabLabel = {
					type: 'varchar',
				};
			}
		}

		if (this.isGenuineBottomPanel(attributes)) {
			const attributesToAdd = ['layout', 'filtersEnabled', 'visibleOnTabs', 'displayLinkButtonInToolbar', 'disabled', 'isSystem'];

			for (const attr of attributesToAdd) {
				if (!options.attributeList.includes(attr)) {
					options.attributeList.push(attr);
				}
			}

			options.attributeDefs.layout = {
				type: 'enum',
				translation: 'Admin.layouts',
				options: this.getLinkLayouts(attributes.name),
			};
			options.attributeDefs.filtersEnabled = {
				type: 'bool',
			};

			options.attributeDefs.visibleOnTabs = {
				type: 'multiEnum',
				options: Object.keys(this.panels),
				translatedOptions: this.panels,
			};

			options.attributeDefs.displayLinkButtonInToolbar = {
				type: 'bool',
				default: true,
				tooltip: true,
			};

			options.attributeDefs.disabled = {
				type: 'bool',
				tooltip: true,
			};

			options.attributeDefs.isSystem = {
				type: 'bool',
				readOnly: true,
			};
		}

		return options;
	}

	fetch() {
		const layout = Dep.prototype.fetch.call(this);

		const newLayout = {};

		for (const name in layout) {
			newLayout[name] = layout[name];

			if (this.isTabName(name) && name !== this.TAB_BREAK_KEY) {
				const data = this.itemsData[name] || {};
				newLayout[name].tabBreak = true;
				newLayout[name].tabLabel = data.tabLabel;
			} else {
				delete newLayout[name].tabBreak;
				delete newLayout[name].tabLabel;
			}
		}
		
		for (const name in this.itemsData) {
			if (!name.includes('.')) {
				if (this.itemsData[name].disabled) {
					if (!newLayout[name]) {
						newLayout[name] = {};
					}
					newLayout[name].disabled = this.itemsData[name].disabled;
				}
				if (this.itemsData[name].isSystem) {
					if (!newLayout[name]) {
						newLayout[name] = {};
					}
					newLayout[name].isSystem = this.itemsData[name].isSystem;
				}
			}
		}

		delete newLayout[this.TAB_BREAK_KEY];

		return newLayout;
	}

	getLinkLayouts(linkName) {
		let foreignScope;

		if (linkName.includes('.')) {
			const parts = linkName.split('.'),
				parentLink = parts[0],
				childrenLink = parts[1];

			const parentScope = this.getMetadata().get(['entityDefs', this.scope, 'links', parentLink, 'entity']);
			foreignScope = this.getMetadata().get(['entityDefs', parentScope, 'links', childrenLink, 'entity']);
		} else {
			foreignScope = this.getMetadata().get(['entityDefs', this.scope, 'links', linkName, 'entity']);
		}

		const additionalLayouts = this.getMetadata().get(['clientDefs', foreignScope, 'additionalLayouts']) || [];

		const options = ['listSmall', 'list'];

		for (const key in additionalLayouts) {
			if (['list', 'listSmall'].includes(additionalLayouts[key].type)) {
				options.push(key);
			}
		}

		return options;
	}
});
