import type LayoutSidePanelsDetailView from 'espocrm/src/views/admin/layouts/side-panels-detail';

type LinkDef = {
	type: string;
	entity?: string;
	disabled?: boolean;
	utility?: boolean;
	layoutRelationshipsDisabled?: boolean;
	[key: string]: unknown;
};

type PanelItem = {
	name: string;
	index?: number;
	disabled?: boolean;
	[key: string]: unknown;
};

type DataFromLayoutResult = {
	panelListAll: string[];
	labels: Record<string, string>;
	params: Record<string, PanelItem>;
};

type LayoutReadResult = {
	disabledFields: PanelItem[];
	rowLayout: PanelItem[];
	itemsData: Record<string, PanelItem>;
};

type LayoutData = Record<string, {
	disabled?: boolean;
	[key: string]: unknown;
}>;

type EditAttributesModalOptions = {
	attributeList: string[];
	attributeDefs: Record<string, AttributeDef>;
	[key: string]: unknown;
};

type AttributeDef = {
	type: string;
	default?: unknown;
	options?: string[];
	translatedOptions?: Record<string, string>;
	tooltip?: boolean | string;
};

type PanelAttributes = {
	name: string;
	[key: string]: unknown;
};

extend<LayoutSidePanelsDetailView>(Dep => class extends Dep {
	hasRelationships: boolean = true;
	declare dataAttributeList: string[];
	declare disabledFields: PanelItem[];
	declare rowLayout: PanelItem[];
	declare itemsData: Record<string, PanelItem>;
	links!: Record<string, boolean>;
	declare scope: string;
	declare viewType: string;

	override setup(): void {
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
	getAllDetailLayouts(scope: string): string[] {
		// Base layout types from EspoCRM
		const baseTypeList = [
			'detail',
			'detailSmall',
		];

		// Clone the base list
		let typeList = Espo.Utils.clone(baseTypeList) as string[];

		// Add additional layouts for this specific scope
		const additionalLayouts = (this.getMetadata().get(['clientDefs', scope, 'additionalLayouts']) || {}) as Record<string, { type?: string }>;

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
	translateLayoutName(type: string, scope: string): string {
		if (this.getLanguage().get(scope, 'layouts', type)) {
			return this.getLanguage().translate(type, 'layouts', scope) as string;
		}

		return this.getLanguage().translate(type, 'layouts', 'Admin') as string;
	}

	/**
	 * @protected
	 */
	override readDataFromLayout(layout: LayoutData): void {
		const data = this.getDataFromLayout(layout, 'sidePanels', (): DataFromLayoutResult => {
			const panelListAll: string[] = [];
			const labels: Record<string, string> = {};
			const params: Record<string, PanelItem> = {};

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

				const linkDefs = (this.getMetadata().get(`entityDefs.${this.scope}.links`) || {}) as Record<string, LinkDef>;

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
					labels[link] = this.translate(link, 'links', this.scope) as string;

					const item: PanelItem = {
						name: link,
						index: 5,
					};

					// Copy relationship panel attributes from metadata
					this.dataAttributeList.forEach((attribute: string) => {
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
		}) as LayoutReadResult;

		this.disabledFields = data.disabledFields;
		this.rowLayout = data.rowLayout;
		this.itemsData = data.itemsData;
	}

	override fetch(): LayoutData {
		const layout = super.fetch() as LayoutData;
		const newLayout: LayoutData = {};

		for (const name in layout) {
			// Skip disabled relationship links
			if (layout[name].disabled && this.links && this.links[name]) {
				continue;
			}

			newLayout[name] = layout[name];
		}

		return newLayout;
	}

	override getEditAttributesModalViewOptions(attributes: PanelAttributes): EditAttributesModalOptions {
		const options = super.getEditAttributesModalViewOptions(attributes) as EditAttributesModalOptions;

		// Check if this is a relationship panel
		if (this.links && this.links[attributes.name]) {
			// Get the foreign entity type
			const linkDefs = (this.getMetadata().get(['entityDefs', this.scope, 'links', attributes.name]) || {}) as LinkDef;
			const foreignScope = linkDefs.entity;

			if (foreignScope) {
				// Get layouts for the foreign entity
				const layoutOptions = this.getAllDetailLayouts(foreignScope);

				// Create translated options map
				const translatedOptions: Record<string, string> = {};
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
