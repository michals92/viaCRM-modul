import type DetailSideRecordView from 'espocrm/src/views/record/detail-side';

type LayoutItem = {
	name?: string;
	index?: number;
	disabled?: boolean;
	dynamicLogicVisible?: unknown;
	style?: string;
	dynamicLogicStyled?: unknown;
	sticked?: boolean;
	[key: string]: unknown;
};

type LayoutData = Record<string, LayoutItem>;

type PanelDef = {
	name: string;
	order?: number;
	view?: string;
	label?: string;
	dynamicLogicVisible?: unknown;
	style?: string;
	dynamicLogicStyled?: unknown;
	sticked?: boolean;
	hidden?: boolean;
	actionsViewKey?: string;
	[key: string]: unknown;
};

type LinkDef = {
	type: string;
	entity?: string;
};

type RecordHelper = {
	getPanelStateParam(name: string, param: string): boolean | null;
	setPanelStateParam(name: string, param: string, value: boolean): void;
};

extend<DetailSideRecordView>(Dep => class extends Dep {
	declare scope: string;
	declare layoutData?: LayoutData;
	declare panelList: PanelDef[];
	recordHelper!: RecordHelper;

	/**
	 * Override alterPanels to add relationship panels after all standard panels are loaded
	 * This is called after setupDefaultPanel() but before setupPanelViews()
	 */
	override alterPanels(): void {
		// Call parent implementation first
		super.alterPanels();

		// Now add relationship panels from layoutData (which is already loaded by parent)
		if (this.layoutData) {
			Object.keys(this.layoutData).forEach((name: string) => {
				const item = this.layoutData![name];

				// Skip disabled items
				if (item.disabled) {
					return;
				}

				// Check if it's a relationship link
				const linkDefs = (this.getMetadata().get(`entityDefs.${this.scope}.links.${name}`) || {}) as LinkDef;

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
	addRelationshipPanel(name: string, item: LayoutItem | string): void {
		const scope = this.scope;
		const scopesDefs = (this.getMetadata().get('scopes') || {}) as Record<string, { disabled?: boolean }>;

		let p: PanelDef;

		if (typeof item === 'string' || item instanceof String) {
			p = {name: item as string};
		} else {
			p = Espo.Utils.clone(item || {}) as PanelDef;
		}

		p.name = p.name || name;

		if (!p.name) {
			return;
		}

		if (typeof p.order === 'undefined') {
			p.order = (item as LayoutItem).index || 5;
		}

		name = p.name;

		const links = ((this.model.defs as { links?: Record<string, LinkDef> }) || {}).links || {};

		if (!(name in links)) {
			return;
		}

		const foreignScope = links[name].entity;

		if (foreignScope && (scopesDefs[foreignScope] || {}).disabled) {
			return;
		}

		if (foreignScope && !this.getAcl().check(foreignScope, 'read')) {
			return;
		}

		let defs = (this.getMetadata().get(['clientDefs', scope, 'relationshipPanels', name]) || {}) as Record<string, unknown>;

		defs = Espo.Utils.clone(defs) as Record<string, unknown>;

		for (const i in defs) {
			if (i in p) {
				continue;
			}

			p[i] = defs[i];
		}

		// For single relationships, use our custom view
		if (!p.view) {
			p.view = 'viacrm:views/record/panels/side-relationship';
		}

		// Set label
		if (!p.label) {
			p.label = this.translate(name, 'links', this.scope) as string;
		}

		// Copy layout attributes
		if ((item as LayoutItem).dynamicLogicVisible) {
			p.dynamicLogicVisible = (item as LayoutItem).dynamicLogicVisible;
		}

		if ((item as LayoutItem).style) {
			p.style = (item as LayoutItem).style;
		}

		if ((item as LayoutItem).dynamicLogicStyled) {
			p.dynamicLogicStyled = (item as LayoutItem).dynamicLogicStyled;
		}

		if ((item as LayoutItem).sticked) {
			p.sticked = (item as LayoutItem).sticked;
		}

		if (this.recordHelper.getPanelStateParam(p.name, 'hidden') !== null) {
			p.hidden = this.recordHelper.getPanelStateParam(p.name, 'hidden') as boolean;
		} else {
			this.recordHelper.setPanelStateParam(p.name, 'hidden', p.hidden || false);
		}

		// Set the actionsViewKey - this is required for the panel-actions view
		p.actionsViewKey = p.name + 'Actions';

		const existingPanel = this.panelList.find((panel: PanelDef) => panel.name == p.name);

		if (existingPanel) {
			Object.assign(existingPanel, p);
		} else {
			this.panelList.push(p);
		}
	}
});
