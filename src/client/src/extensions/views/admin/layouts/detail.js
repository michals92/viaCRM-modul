extend(Dep => class extends Dep {
	dataAttributeList = ['name', 'customLabel', 'noLabel', 'color', 'bold', 'css', 'horizontalLabel'];

	dataAttributesDefs = {
		name: {
			readOnly: true,
		},
		customLabel: {
			type: 'varchar',
		},
		noLabel: {
			type: 'bool',
		},
		color: {
			type: 'varchar',
			view: 'views/fields/colorpicker',
		},
		bold: {
			type: 'bool',
		},
		css: {
			type: 'varchar',
		},
		horizontalLabel: {
			type: 'bool',
		},
	};

	rowAttributeList = ['divider', 'dividerWidth', 'dividerColor'];

	rowAttributesDefs = {
		divider: {
			type: 'bool',
		},
		dividerWidth: {
			type: 'int',
		},
		dividerColor: {
			type: 'colorpicker',
		},
	};

	rowDynamicLogicDefs = {
		fields: {
			dividerWidth: {
				visible: {
					conditionGroup: [
						{
							type: 'isTrue',
							attribute: 'divider',
						},
					],
				},
				required: {
					conditionGroup: [
						{
							type: 'isTrue',
							attribute: 'divider',
						},
					],
				},
			},
			dividerColor: {
				visible: {
					conditionGroup: [
						{
							type: 'isTrue',
							attribute: 'divider',
						},
					],
				},
				required: {
					conditionGroup: [
						{
							type: 'isTrue',
							attribute: 'divider',
						},
					],
				},
			},
		},
	};

	setup() {
		const tabLabelIndex = this.panelDataAttributeList.indexOf('tabLabel');

		if (tabLabelIndex !== -1) {
			this.panelDataAttributeList.splice(tabLabelIndex + 1, 0, 'tabIconClass');
			this.panelDataAttributeList.splice(tabLabelIndex + 2, 0, 'tabColor');
		} else {
			this.panelDataAttributeList.push('tabIconClass');
			this.panelDataAttributeList.push('tabColor');
		}

		this.panelDataAttributesDefs.tabIconClass = {
			type: 'varchar',
			view: 'autocrm:views/fields/icon-class'
		};

		this.panelDataAttributesDefs.tabColor = {
			type: 'colorpicker'
		};

		this.panelDynamicLogicDefs.fields.tabIconClass = {
			visible: {
				conditionGroup: [
					{
						attribute: 'tabBreak',
						type: 'isTrue',
					}
				]
			}
		};

		this.panelDynamicLogicDefs.fields.tabColor = {
			visible: {
				conditionGroup: [
					{
						attribute: 'tabBreak',
						type: 'isTrue',
					}
				]
			}
		};

		const orgRequire = Espo.loader.require;

		Espo.loader.require = (dep, callback) => {
			orgRequire.call(Espo.loader, dep, resolved => {
				// sets this.$style
				callback(resolved);

				if (dep === 'res!client/css/misc/layout-manager-grid.css') {
					// We append to the $style in the parent so that these CSS rules override the parent's CSS rules
					this.$additionalStyle = $('<style>')
						.html('#layout ul.rows > li { height: 80px; } #layout ul.cells { margin-top: 0 }')
						.appendTo(this.$style);
				}
			});
		};

		super.setup();

		Espo.loader.require = orgRequire;
	}

	onRemove() {
		super.onRemove();

		if (this.$additionalStyle) {
			this.$additionalStyle.remove();
		}
	}

	setupEvents() {
		super.setupEvents();

		this.events['click #layout a[data-action="editField"]'] = e => {
			const $li = $(e.target).closest('li');
			const attributes = {};

			this.dataAttributeList.forEach(attr => {
				let value = null;

				if (attr === 'name') {
					value = this.translate($li.data('name'), 'fields', this.scope);
				} else {
					value = $li.attr('data-' + Espo.Utils.toDom(attr));
				}

				attributes[attr] = value || null;
			});

			this.createView(
				'dialog',
				'autocrm:views/admin/layouts/modals/cell-attributes',
				{
					attributeList: this.dataAttributeList,
					attributeDefs: this.dataAttributesDefs,
					attributes,
				},
				view => {
					view.render();

					this.listenTo(view, 'after:save', attributes => {
						if (attributes.customLabel) {
							$li.attr('data-custom-label', attributes.customLabel);
						} else {
							$li.removeAttr('data-custom-label');
						}

						delete attributes.name;
						delete attributes.customLabel;

						this.dataAttributeList.forEach(attr => {
							if (attr in attributes) {
								$li.attr('data-' + Espo.Utils.toDom(attr), attributes[attr]);
							}
						});

						view.close();
						this.setIsChanged();
					});
				},
			);
		};

		this.events['click #layout a[data-action="edit-row-label"]'] = e => {
			const $li = $(e.currentTarget).parent();
			const attributes = {};

			this.rowAttributeList.forEach(attr => {
				const value = $li.attr('data-' + Espo.Utils.toDom(attr));

				switch (this.rowAttributesDefs[attr].type) {
					case 'bool':
						attributes[attr] = value === 'true';
						break;
					case 'int':
						attributes[attr] = value !== undefined ? parseInt(value, 10) : null;
						break;
					default:
						attributes[attr] = value !== undefined ? value : null;
				}
			});

			this.createView(
				'dialog',
				'autocrm:views/admin/layouts/modals/row-attributes',
				{
					attributeList: this.rowAttributeList,
					attributeDefs: this.rowAttributesDefs,
					attributes,
					dynamicLogicDefs: this.rowDynamicLogicDefs,
				},
				view => {
					view.render();

					this.listenTo(view, 'after:save', attributes => {
						this.rowAttributeList.forEach(attr => {
							if (attr in attributes) {
								$li.attr('data-' + Espo.Utils.toDom(attr), attributes[attr]);
							}
						});

						view.close();
						this.setIsChanged();
					});
				},
			);
		};
	}

	createPanelView(data, empty, callback) {
		const createViewOrg = this.createView;

		data.rows.forEach((row, rowIndex) => {
			row.forEach(cell => {
				if (cell) {
					cell.dataAttributes = this.dataAttributeList.filter(attr => cell[attr]);
				}
			});

			// Add row data attributes
			row.rowDataAttributes = this.rowAttributeList.filter(
				attr => data.rowData && data.rowData[rowIndex] && data.rowData[rowIndex][attr] !== undefined,
			);
		});

		this.createView = (name, view, options, callback) => {
			options.template = 'autocrm:admin/layouts/grid-panel';
			options.data = data; // Pass the modified data to the template

			createViewOrg.call(this, name, view, options, callback);
		};

		super.createPanelView(data, empty, callback);

		this.createView = createViewOrg;
	}

	// Exclude fields that are rendered in any active side panel (not only the default panel)
	isFieldEnabled(model, name) {
		// Respect core checks first
		if (!super.isFieldEnabled(model, name)) {
			return false;
		}

		// Build a cache of fields used by active side panels for the current type
		if (!this._activeSidePanelFieldSet) {
			this._activeSidePanelFieldSet = new Set();

			// Use current type (detail|detailSmall) and also normalized realType
			const viewType = this.type;
			let realType = this.realType;
			if (realType === 'detailSmall') realType = 'detail';

			const collectForType = (type) => {
				const panels = this.getMetadata().get(['clientDefs', this.scope, 'sidePanels', type]) || [];

				panels.forEach(p => {
					if (!p || !p.name) return;

					// Skip default panel (already handled by core via defaultSidePanel)
					if (p.name === 'default') return;

					// Determine if panel is disabled (layout overrides metadata)
					let disabled = false;

					if (type === viewType && this.sidePanelsLayout && this.sidePanelsLayout[p.name]) {
						disabled = !!this.sidePanelsLayout[p.name].disabled;
					}

					if (!disabled && p.disabled) disabled = true;

					if (disabled) return;

					// Add fields declared by the side panel
					const fieldList = p.fieldList || [];
					fieldList.forEach(f => {
						if (typeof f === 'string') {
							this._activeSidePanelFieldSet.add(f);
						} else if (f && typeof f === 'object' && f.name) {
							this._activeSidePanelFieldSet.add(f.name);
						}
					});
				});
			};

			collectForType(viewType);
			if (realType && realType !== viewType) collectForType(realType);
		}

		if (this._activeSidePanelFieldSet.has(name)) {
			return false;
		}

		return true;
	}
	
	fetch() {
		const layout = super.fetch();

		// Collect the row data
		$('#layout ul.panels > li').each((panelIndex, panelEl) => {
			const panel = layout[panelIndex];

			if (panel) {
				panel.rowData = [];

				$(panelEl)
					.find('ul.rows > li')
					.each((rowIndex, rowEl) => {
						const rowData = {};

						this.rowAttributeList.forEach(attr => {
							const value = $(rowEl).attr(`data-${Espo.Utils.toDom(attr)}`);
							switch (this.rowAttributesDefs[attr].type) {
								case 'bool':
									rowData[attr] = value === 'true';
									break;
								case 'int':
									rowData[attr] = value !== undefined ? parseInt(value, 10) : null;
									break;
								default:
									rowData[attr] = value !== undefined ? value : null;
							}
						});

						panel.rowData[rowIndex] = rowData;
					});
			}
		});

		return layout;
	}
});
