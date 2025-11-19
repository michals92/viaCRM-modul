extend(Dep => class extends Dep {
	optionsFields = {
		title: {
			type: 'varchar',
			required: false,
		},
		autorefreshInterval: {
			type: 'enumFloat',
			options: [0, 0.5, 1, 2, 5, 10],
		},
	};

	init() {
		super.init();

		if (this.getPreferences().get('collapsibleDashlets')) {
			let _class = 'fa fa-toggle-on';

			if (this.options.collapsed) {
				_class = 'fa fa-toggle-off';
			}

			this.buttonList.push({
				name: 'toggle',
				html: `<span class="${_class}"></span>`,
			});
		}
	}

	actionToggle() {
		this.collapseDashlet(this.id);
		this.$el.parent().find('button[data-name="toggle"] > span').toggleClass('fa-toggle-off fa-toggle-on');
	}

	getDashboard() {
		return this.getParentView().getParentView();
	}

	getGrid() {
		return this.getDashboard().grid;
	}

	collapseDashlet(id) {
		const dashlet = this.getDashboard().currentTabLayout.find(dashlet => dashlet.id === id);

		if (dashlet) {
			const $gridstackItem = this.getDashboard().$gridstack.find(`.grid-stack-item[data-id="${id}"]`);

			if (dashlet.collapsed) {
				const h = $gridstackItem.attr('gs-real-height');

				//Force re-render using minH
				this.getGrid().update($gridstackItem.get(0), {
					minH: h,
					h,
				});

				//Set back to 1, so we can resize
				this.getGrid().update($gridstackItem.get(0), {
					minH: 2,
				});
				this.getGrid().resizable($gridstackItem.get(0), true);
				this.reRender();
			} else {
				this.getGrid().update($gridstackItem.get(0), {
					minH: 1,
					h: 1,
				});

				this.getGrid().resizable($gridstackItem.get(0), false);
			}

			dashlet.collapsed = !(dashlet.collapsed ?? false);

			this.getDashboard().fetchLayout();
			this.getDashboard().saveLayout();
		}
	}
});
