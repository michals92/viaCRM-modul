import type DetailBottomRecordView from 'espocrm/src/views/record/detail-bottom';

type LayoutDataItem = {
	disabled?: boolean;
	visibleOnTabs?: Record<string, boolean>;
	index?: number;
};

type PanelDef = {
	name: string;
	tabNumber?: number;
	tabHidden?: boolean;
};

type LinksDef = Record<string, { entity?: string }>;

type ModelDefs = {
	links?: LinksDef;
};

extend<DetailBottomRecordView>(Dep => class extends Dep {
	declare scope: string;
	declare layoutData: Record<string, LayoutDataItem>;
	declare panelList: PanelDef[];
	declare model: {
		name: string;
		defs: ModelDefs;
	};

	override init(): void {
		super.init();

		if (this.getMetadata().get(['clientDefs', this.scope, 'bottomLayoutType']) === 'tab') {
			this.template = 'viacrm:record/bottom/tabs';
		}
	}

	override setup(): void {
		super.setup();

		this.on('tab-selected', (tab: string) => {
			for (const panel of this.panelList) {
				const panelLayoutData = this.layoutData[panel.name];

				if (panelLayoutData && panelLayoutData.visibleOnTabs) {
					if (tab.toString() in panelLayoutData.visibleOnTabs) {
						this.showPanel(panel.name);
					} else {
						this.hidePanel(panel.name);
					}
				}
			}
		});
	}

	override alterPanels(_layoutData?: Record<string, LayoutDataItem>): void {
		// Filter out disabled panels from layoutData before parent processing
		const filteredLayoutData: Record<string, LayoutDataItem> = {};
		for (const name in this.layoutData) {
			if (!this.layoutData[name].disabled) {
				filteredLayoutData[name] = this.layoutData[name];
			}
		}
		this.layoutData = filteredLayoutData;

		const links = (this.model.defs || {}).links,
			originalLinks = Espo.Utils.cloneDeep(links) as LinksDef | undefined;

		if (links) {
			Object.keys(this.layoutData)
				.filter((name: string) => name.includes('.'))
				.forEach((name: string) => {
					// No need to check disabled here anymore, already filtered above

					const linkName = name.split('.')[0];
					links[name] = {
						entity: this.getMetadata().get([
							'entityDefs',
							this.model.name,
							'links',
							linkName,
							'entity',
						]) as string,
					};

					const obj = Espo.Utils.cloneDeep(this.layoutData[name]) as LayoutDataItem & { view?: string; link?: string; actionsViewKey?: string },
						safeName = name.replace('.', '_');
					obj.view = 'viacrm:views/record/panels/related-link';
					obj.link = name;
					obj.actionsViewKey = safeName + 'Actions';
					this.addRelationshipPanel(name, obj);

					const pushedPanel = this.panelList[this.panelList.length - 1];
					if (pushedPanel.name === name) {
						pushedPanel.name = safeName;
					}
				});
		}

		this.model.defs.links = originalLinks;

		// Call parent logic with filtered layout data
		super.alterPanels(this.layoutData);
	}
});
