extend(Dep => class extends Dep {

	alterPanels(layoutData) {
        
		// Call parent implementation first
		super.alterPanels(layoutData);
        
		// Now enhance the tabDataList with dynamic logic
		layoutData = layoutData || this.layoutData || {};
        
        
		// Find tab breaks and enhance the tabDataList
		if (this.tabDataList && this.tabDataList.length > 0) {
			// Create a map of tab breaks from layoutData
			const tabBreaks = [];
			for (const name in layoutData) {
				const item = layoutData[name];
				if (item.tabBreak) {
					tabBreaks.push({
						name: name,
						index: item.index,
						dynamicLogicVisible: item.dynamicLogicVisible,
						tabLabel: item.tabLabel
					});
				}
			}
            
			// Sort tab breaks by index to match tabDataList order
			tabBreaks.sort((a, b) => a.index - b.index);
            
            
			// Now enhance each tab in tabDataList with the corresponding tab break data
			this.tabDataList.forEach((tab, i) => {
				if (tabBreaks[i]) {
					tab.dynamicLogicVisible = tabBreaks[i].dynamicLogicVisible;
					tab.name = tabBreaks[i].name;
				}
			});
		}


		// Set up tab dynamic logic after we have the model
		if (this.recordViewObject && this.recordViewObject.model) {
			this.setupTabDynamicLogic();
		} else {
			// Wait for the record view to be ready
			this.listenToOnce(this, 'record-view-ready', () => {
				this.setupTabDynamicLogic();
			});
		}
	}
    
	setupTabDynamicLogic() {
		if (!this.recordViewObject || !this.recordViewObject.model || !this.recordViewObject.dynamicLogic || !this.tabDataList) {
			return;
		}
		
		// Process each tab with dynamic logic
		this.tabDataList.forEach((tabData, tabIndex) => {
            
			if (tabData.dynamicLogicVisible) {
                
				// Evaluate and apply initial visibility
				this.evaluateTabVisibility(tabIndex);
                
				// Set up listeners for field changes
				this.setupTabFieldListeners(tabIndex);
			}
		});
	}
    
	setupTabFieldListeners(tabIndex) {
		const model = this.recordViewObject.model;
        
		this.listenTo(model, `change`, () => this.evaluateTabVisibility(tabIndex));
	}
    
	evaluateTabVisibility(tabIndex) {
		const tabData = this.tabDataList[tabIndex];
		if (!tabData || !tabData.dynamicLogicVisible) {
			return;
		}
        
		const shouldBeVisible = this.recordViewObject.dynamicLogic.checkConditionGroup(tabData.dynamicLogicVisible);
        
		if (shouldBeVisible) {
			this.showTab(tabIndex);
		} else {
			this.hideTab(tabIndex, false, 'dynamicLogic');
		}
	}

	showPanel(name, softLockedType, callback) {
        
		// Check if this is a tab pseudo-panel
		if (name && name.startsWith('_tab_')) {
			const tabNumber = parseInt(name.substring(5));
			if (!isNaN(tabNumber)) {
				this.showTab(tabNumber, softLockedType);
				return;
			}
		}

		// Call parent implementation for regular panels
		super.showPanel(name, softLockedType, callback);
	}

	hidePanel(name, locked, softLockedType, callback) {
        
		// Check if this is a tab pseudo-panel
		if (name && name.startsWith('_tab_')) {
			const tabNumber = parseInt(name.substring(5));
			if (!isNaN(tabNumber)) {
				this.hideTab(tabNumber, locked, softLockedType);
				return;
			}
		}

		// Call parent implementation for regular panels
		super.hidePanel(name, locked, softLockedType, callback);
	}

	showTab(tabNumber) {
        
		// Update tabDataList to mark tab as visible
		if (this.tabDataList && this.tabDataList[tabNumber]) {
			this.tabDataList[tabNumber].hidden = false;
		}

		// Show the tab button
		if (this.isRendered()) {
			const $tabElement = this.$el.find(`.tabs > [data-tab="${tabNumber}"]`);
			if ($tabElement.length) {
				$tabElement.removeClass('hidden');
			}
            
			// Make sure tabs container is visible
			this.$el.find('.tabs').removeClass('hidden');
		}

		// Don't touch panel visibility here - that's handled by selectTab
		// Just update the tabHidden state for the panels
		this.panelList
			.filter(panel => panel.tabNumber === tabNumber)
			.forEach(panel => {
				if (panel.name) {
					panel.tabHidden = false;
				}
			});

		// If no tab is currently selected, select this one
		if (this.currentTab === -1 || !this.isTabVisible(this.currentTab)) {
			this.selectTab(tabNumber, true);
		}
	}

	hideTab(tabNumber) {
        
		// Update tabDataList to mark tab as hidden
		if (this.tabDataList && this.tabDataList[tabNumber]) {
			this.tabDataList[tabNumber].hidden = true;
		}

		// Hide the tab button
		if (this.isRendered()) {
			const $tabElement = this.$el.find(`.tabs > [data-tab="${tabNumber}"]`);
			if ($tabElement.length) {
				$tabElement.addClass('hidden');
			}
            
			// Check if all tabs are hidden, hide the tabs container
			const $allTabs = this.$el.find('.tabs > [data-tab]');
			const $visibleTabs = $allTabs.not('.hidden');
			if ($visibleTabs.length === 0) {
				this.$el.find('.tabs').addClass('hidden');
			}
		}

		// Hide all panels in this tab
		this.panelList
			.filter(panel => panel.tabNumber === tabNumber)
			.forEach(panel => {
				if (panel.name) {
					panel.tabHidden = true;
					// Add tab-hidden class to panels if already rendered
					if (this.isRendered()) {
						const $panel = this.$el.find(`.panel[data-name="${panel.name}"]`);
						if ($panel.length) {
							$panel.addClass('tab-hidden');
						}
					}
				}
			});

		// If current tab is being hidden, switch to another visible tab
		if (this.currentTab === tabNumber) {
			const firstVisibleTab = this.findFirstVisibleTab();
			if (firstVisibleTab !== -1) {
				this.selectTab(firstVisibleTab, true);
			}
		}
	}
    
	isTabVisible(tabNumber) {
		if (!this.tabDataList || !this.tabDataList[tabNumber]) {
			return false;
		}
		return !this.tabDataList[tabNumber].hidden;
	}
    
	findFirstVisibleTab() {
		if (!this.tabDataList) {
			return -1;
		}
        
		for (let i = 0; i < this.tabDataList.length; i++) {
			if (!this.tabDataList[i].hidden) {
				return i;
			}
		}
        
		return -1;
	}


	getTabDataList() {
		const tabDataList = super.getTabDataList();

		// Update hidden state based on our tabDataList
		return tabDataList.map((tabData, i) => {
			if (this.tabDataList && this.tabDataList[i]) {
				tabData.hidden = this.tabDataList[i].hidden || false;
			}
			return tabData;
		});
	}

	afterRender() {
		super.afterRender();
		
		// Apply initial tab selection to ensure panels are correctly hidden/shown
		// This fixes the issue where all panels show on page load before any tab switching
		if (this.hasTabs && this.tabDataList && this.tabDataList.length > 0) {
			// Find the current tab or first visible tab
			let selectedTab = this.currentTab;
			if (selectedTab === -1 || !this.isTabVisible(selectedTab)) {
				selectedTab = this.findFirstVisibleTab();
			}
			
			if (selectedTab !== -1) {
				// Force a tab selection to apply the correct visibility classes
				this.selectTab(selectedTab, true);
			}
		}
	}

});