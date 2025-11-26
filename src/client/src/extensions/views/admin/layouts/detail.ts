import type LayoutDetailView from 'espocrm/src/views/admin/layouts/detail';

type DataAttributesDefs = Record<string, {
	type?: string;
	view?: string;
	readOnly?: boolean;
}>;

type RowAttributesDefs = Record<string, {
	type: string;
}>;

type DynamicLogicDefs = {
	fields: Record<string, {
		visible?: {
			conditionGroup: Array<{
				type: string;
				attribute: string;
			}>;
		};
		required?: {
			conditionGroup: Array<{
				type: string;
				attribute: string;
			}>;
		};
	}>;
};

type CellData = {
	name?: string;
	dataAttributes?: string[];
	[key: string]: unknown;
};

type RowData = {
	rowDataAttributes?: string[];
	forEach(callback: (cell: CellData | null) => void): void;
};

type PanelData = {
	rows: RowData[];
	rowData?: Array<Record<string, unknown>>;
	[key: string]: unknown;
};

type LayoutPanel = {
	rowData?: Array<Record<string, unknown>>;
	[key: string]: unknown;
};

type EditAttributesView = {
	render(): void;
	close(): void;
};

type SidePanelDef = {
	name?: string;
	disabled?: boolean;
	fieldList?: Array<string | { name: string }>;
};

type SidePanelsLayout = Record<string, { disabled?: boolean }>;

extend<LayoutDetailView>(Dep => class extends Dep {
	override dataAttributeList = ['name', 'customLabel', 'noLabel', 'color', 'bold', 'css', 'horizontalLabel'];

	override dataAttributesDefs: DataAttributesDefs = {
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

	rowAttributeList: string[] = ['divider', 'dividerWidth', 'dividerColor'];

	rowAttributesDefs: RowAttributesDefs = {
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

	rowDynamicLogicDefs: DynamicLogicDefs = {
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

	$additionalStyle?: JQuery;
	declare panelDataAttributeList: string[];
	declare panelDataAttributesDefs: DataAttributesDefs;
	declare panelDynamicLogicDefs: DynamicLogicDefs;
	declare scope: string;
	declare type: string;
	declare realType: string;
	declare sidePanelsLayout?: SidePanelsLayout;
	_activeSidePanelFieldSet?: Set<string>;

	override setup(): void {
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
			view: 'viacrm:views/fields/icon-class'
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

		Espo.loader.require = (dep: string, callback: (resolved: unknown) => void) => {
			orgRequire.call(Espo.loader, dep, (resolved: unknown) => {
				// sets this.$style
				callback(resolved);

				if (dep === 'res!client/css/misc/layout-manager-grid.css') {
					// We append to the $style in the parent so that these CSS rules override the parent's CSS rules
					this.$additionalStyle = $('<style>')
						.html('#layout ul.rows > li { height: 80px; } #layout ul.cells { margin-top: 0 }')
						.appendTo((this as unknown as { $style: JQuery }).$style);
				}
			});
		};

		super.setup();

		Espo.loader.require = orgRequire;
	}

	override onRemove(): void {
		super.onRemove();

		if (this.$additionalStyle) {
			this.$additionalStyle.remove();
		}
	}

	setupEvents(): void {
		super.setupEvents();

		this.events['click #layout a[data-action="editField"]'] = (e: Event) => {
			const $li = $(e.target as HTMLElement).closest('li');
			const attributes: Record<string, unknown> = {};

			this.dataAttributeList.forEach((attr: string) => {
				let value: unknown = null;

				if (attr === 'name') {
					value = this.translate($li.data('name') as string, 'fields', this.scope);
				} else {
					value = $li.attr('data-' + Espo.Utils.toDom(attr));
				}

				attributes[attr] = value || null;
			});

			this.createView(
				'dialog',
				'viacrm:views/admin/layouts/modals/cell-attributes',
				{
					attributeList: this.dataAttributeList,
					attributeDefs: this.dataAttributesDefs,
					attributes,
				},
				(view: EditAttributesView) => {
					view.render();

					this.listenTo(view, 'after:save', (savedAttributes: Record<string, unknown>) => {
						if (savedAttributes.customLabel) {
							$li.attr('data-custom-label', savedAttributes.customLabel as string);
						} else {
							$li.removeAttr('data-custom-label');
						}

						delete savedAttributes.name;
						delete savedAttributes.customLabel;

						this.dataAttributeList.forEach((attr: string) => {
							if (attr in savedAttributes) {
								$li.attr('data-' + Espo.Utils.toDom(attr), savedAttributes[attr] as string);
							}
						});

						view.close();
						this.setIsChanged();
					});
				},
			);
		};

		this.events['click #layout a[data-action="edit-row-label"]'] = (e: Event) => {
			const $li = $(e.currentTarget as HTMLElement).parent();
			const attributes: Record<string, unknown> = {};

			this.rowAttributeList.forEach((attr: string) => {
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
				'viacrm:views/admin/layouts/modals/row-attributes',
				{
					attributeList: this.rowAttributeList,
					attributeDefs: this.rowAttributesDefs,
					attributes,
					dynamicLogicDefs: this.rowDynamicLogicDefs,
				},
				(view: EditAttributesView) => {
					view.render();

					this.listenTo(view, 'after:save', (savedAttributes: Record<string, unknown>) => {
						this.rowAttributeList.forEach((attr: string) => {
							if (attr in savedAttributes) {
								$li.attr('data-' + Espo.Utils.toDom(attr), savedAttributes[attr] as string);
							}
						});

						view.close();
						this.setIsChanged();
					});
				},
			);
		};
	}

	override createPanelView(data: PanelData, empty: boolean, callback: () => void): void {
		const createViewOrg = this.createView;

		data.rows.forEach((row: RowData, rowIndex: number) => {
			row.forEach((cell: CellData | null) => {
				if (cell) {
					cell.dataAttributes = this.dataAttributeList.filter((attr: string) => cell[attr]);
				}
			});

			// Add row data attributes
			row.rowDataAttributes = this.rowAttributeList.filter(
				(attr: string) => data.rowData && data.rowData[rowIndex] && data.rowData[rowIndex][attr] !== undefined,
			);
		});

		this.createView = (name: string, view: string, options: Record<string, unknown>, cb: (view: unknown) => void) => {
			options.template = 'viacrm:admin/layouts/grid-panel';
			options.data = data; // Pass the modified data to the template

			createViewOrg.call(this, name, view, options, cb);
		};

		super.createPanelView(data, empty, callback);

		this.createView = createViewOrg;
	}

	// Exclude fields that are rendered in any active side panel (not only the default panel)
	override isFieldEnabled(model: unknown, name: string): boolean {
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

			const collectForType = (type: string): void => {
				const panels = (this.getMetadata().get(['clientDefs', this.scope, 'sidePanels', type]) || []) as SidePanelDef[];

				panels.forEach((p: SidePanelDef) => {
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
					fieldList.forEach((f: string | { name: string }) => {
						if (typeof f === 'string') {
							this._activeSidePanelFieldSet!.add(f);
						} else if (f && typeof f === 'object' && f.name) {
							this._activeSidePanelFieldSet!.add(f.name);
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

	override fetch(): LayoutPanel[] {
		const layout = super.fetch() as LayoutPanel[];

		// Collect the row data
		$('#layout ul.panels > li').each((panelIndex: number, panelEl: HTMLElement) => {
			const panel = layout[panelIndex];

			if (panel) {
				panel.rowData = [];

				$(panelEl)
					.find('ul.rows > li')
					.each((rowIndex: number, rowEl: HTMLElement) => {
						const rowData: Record<string, unknown> = {};

						this.rowAttributeList.forEach((attr: string) => {
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

						panel.rowData![rowIndex] = rowData;
					});
			}
		});

		return layout;
	}
});
