extend(Dep => class extends Dep {
	init() {
		super.init();

		if (this.getMetadata().get(['clientDefs', this.scope, 'bottomLayoutType']) === 'tab') {
			this.template = 'autocrm:record/bottom/tabs';
		}
	}

	setup() {
		super.setup();

		this.on('tab-selected', tab => {
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

	alterPanels(_layoutData) {
		// Filter out disabled panels from layoutData before parent processing
		const filteredLayoutData = {};
		for (const name in this.layoutData) {
			if (!this.layoutData[name].disabled) {
				filteredLayoutData[name] = this.layoutData[name];
			}
		}
		this.layoutData = filteredLayoutData;
		
		const links = (this.model.defs || {}).links,
			originalLinks = Espo.Utils.cloneDeep(links);

		if (links) {
			Object.keys(this.layoutData)
				.filter(name => name.includes('.'))
				.forEach(name => {
					// No need to check disabled here anymore, already filtered above

					let linkName = name.split('.')[0];
					links[name] = {
						entity: this.getMetadata().get([
							'entityDefs',
							this.model.name,
							'links',
							linkName,
							'entity',
						]),
					};

					const obj = Espo.Utils.cloneDeep(this.layoutData[name]),
						safeName = name.replace('.', '_');
					obj.view = 'autocrm:views/record/panels/related-link';
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
