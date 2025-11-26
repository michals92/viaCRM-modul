define(['views/fields/base', 'model'], (Dep, Model) => class extends Dep {
	override editTemplate = 'autocrm:admin/colorization/fields/colorization-rules';

	override data() {
		return {
			itemDataList: this.itemDataList,
			isEditMode: this.isEditMode(),
		};
	}

	override setup() {
		this.inlineEditDisabled = true;

		this.setEditMode();

		this.events['click [data-action="editConditions"]'] = (e) => {
			var index = parseInt($(e.currentTarget).data("index"));
			this.edit(index);
		};

		this.events['click [data-action="addRule"]'] = (_) => {
			this.addRule();
		};

		this.events['click [data-action="removeRule"]'] = (e) => {
			var index = parseInt($(e.currentTarget).data("index"));
			this.removeItem(index);
		};

		let optionsDefsList = Espo.Utils.cloneDeep(this.model.get(this.name));

		if (!Array.isArray(optionsDefsList)) {
			optionsDefsList = [];
		}

		optionsDefsList.forEach((item, i) => {
			if (!item || typeof item !== "object") {
				optionsDefsList[i] = {
					conditionGroup: null,
					color: "#000000",
				};
			}

			if (!item.color) {
				item.color = "#000000";
			}

			if (
				item.conditionGroup !== null &&
				!Array.isArray(item.conditionGroup)
			) {
				item.conditionGroup = [];
			}
		});
  
		this.optionsDefsList = optionsDefsList;
		this.scope = this.model.parentEntityType;
  
		this.setupItems();
		this.setupItemViews();
	}
  
	setupItems() {
		this.itemDataList = [];
  
		this.optionsDefsList.forEach((_item, i) => {
			this.itemDataList.push({
				conditionGroupViewKey: "conditionGroup" + i.toString(),
				key: "nestedView" + i.toString(),
				index: i,
			});
		});
	}
  
	setupItemViews() {
		if (!this.optionsDefsList || this.optionsDefsList.length === 0) {
			// Intentionally empty
		} else {
			this.optionsDefsList.forEach((_item, i) => {
				this.createStringView(i);
				this.createNestedView(i);
			});
		}
	}
  
	getTranslatedOptions() {
		if (this.model.get("translatedOptions")) {
			return this.model.get("translatedOptions");
		}
  
		var translatedOptions = {};
  
		var list = this.model.get("options") || [];
  
		list.forEach((value) => {
			translatedOptions[value] = this.getLanguage().translateOption(
				value,
				this.options.field,
				this.model.parentEntityType
			);
		});
  
		return translatedOptions;
	}
  
	createNestedView(num) {
		if (!this.optionsDefsList[num]) {
			return;
		}
  
		const model = new Model();
  
		model.entityType = "Admin";
  
		model.defs = {
			fields: {
				color: {
					type: "colorpicker",
					default: "#000000",
				},
			},
		};
  
		const defs = this.optionsDefsList[num];
  
		const originalColor = defs.color;
		model.isInitializing = true;
		model.set("color", defs.color);
  
		const key = "nestedView" + num.toString();
  
		try {
			this.createView(
				key,
				"views/record/edit-small",
				{
					model: model,
					selector: '.nested-view-container[data-key="' + key + '"]',
					type: "editSmall",
					detailLayout: this.getDetailLayout(),
					buttonsDisabled: true,
				},
				(view) => {
					if (this.isRendered()) {
						view.render();
				
						this.listenTo(model, "change", () => {
							const newColor = model.get("color");
					
							if (model.isInitializing && newColor === "#000000") {
								return;
							}
					
							this.optionsDefsList[num].color = newColor;
							this.trigger("change");
						});
				
						model.isInitializing = false;
				
						setTimeout(() => {
							model.set("color", originalColor);
						}, 50);
					}
				}
			);
		} catch (e) {
			const $container = this.$el.find(
				'.nested-view-container[data-key="' + key + '"]'
			);
			if ($container.length) {
				$container.html(
					'<em class="text-muted">Error creating color picker</em>'
				);
			}
		}
	}
  
	getDetailLayout() {
		return [
			{
				rows: [
					[
						{
							name: "color",
							label: this.translate("color", "fields", "Admin"),
						},
					],
				],
			},
		];
	}
  
	createStringView(num) {
		var key = "conditionGroup" + num.toString();
  
		if (!this.optionsDefsList[num]) {
			return;
		}
  
		if (this.optionsDefsList[num].conditionGroup === null) {
			const $container = this.$el.find(
				'.string-container[data-key="' + key + '"]'
			);
			if ($container.length) {
				$container.html(
					'<em class="text-muted">Click "Edit Conditions" to set conditions</em>'
				);
			}
			return;
		}
  
		try {
			try {
				let itemData = {
					value: this.optionsDefsList[num].conditionGroup,
				};
  
				this.createView(
					key,
					"views/admin/dynamic-logic/conditions-string/group-base",
					{
						selector: '.string-container[data-key="' + key + '"]',
						itemData: itemData,
						operator: "and",
						scope: this.scope,
					},
					(view) => {
						if (this.isRendered()) {
							view.render();
						}
					}
				);
			} catch (e) {
				const $container = this.$el.find(
					'.string-container[data-key="' + key + '"]'
				);
				if ($container.length) {
					try {
						this.createView(
							key,
							"views/admin/dynamic-logic/conditions-string/group-base",
							{
								selector: '.string-container[data-key="' + key + '"]',
								itemData: {
									value: [],
								},
								operator: "and",
								scope: this.scope,
							},
							(view) => {
								if (this.isRendered()) {
									view.render();
								}
							}
						);
					} catch (e) {
						$container.html(
							'<em class="text-muted">Error rendering conditions</em>'
						);
					}
				}
			}
		} catch (e) {
			const $container = this.$el.find(
				'.string-container[data-key="' + key + '"]'
			);
			if ($container.length) {
				$container.html(
					'<em class="text-muted">Error: ' + e.message + "</em>"
				);
			}
		}
	}
  
	edit(num) {
		if (this.optionsDefsList[num].conditionGroup === null) {
			this.optionsDefsList[num].conditionGroup = [];
		} else if (!Array.isArray(this.optionsDefsList[num].conditionGroup)) {
			this.optionsDefsList[num].conditionGroup = [];
		}
  
		try {
			const modalEl = $(
				'<div class="modal" tabindex="-1" role="dialog"></div>'
			);
  
			this.createView(
				"modal",
				"views/admin/dynamic-logic/modals/edit",
				{
					conditionGroup: this.optionsDefsList[num].conditionGroup,
					scope: this.model.parentEntityType,
					el: modalEl,
				},
				(view) => {
					view.render();
  
					this.listenTo(view, "apply", (conditionGroup) => {
						if (Array.isArray(conditionGroup)) {
							this.optionsDefsList[num].conditionGroup = conditionGroup;
						} else if (
							conditionGroup &&
							typeof conditionGroup === "object" &&
							conditionGroup.value
						) {
							this.optionsDefsList[num].conditionGroup = Array.isArray(
								conditionGroup.value
							)
								? conditionGroup.value
								: [];
						} else {
							this.optionsDefsList[num].conditionGroup = [];
						}
  
						this.trigger("change");
  
						this.createStringView(num);
					});
				}
			);
		} catch (e) {
			alert("Error creating edit modal: " + e.message);
		}
	}
  
	addRule() {
		for (let i = 0; i < this.optionsDefsList.length; i++) {
			const viewKey = "nestedView" + i.toString();
			const view = this.getView(viewKey);
			if (view && view.model) {
				const currentColor = view.model.get("color");
				this.optionsDefsList[i].color = currentColor;
			}
		}
		
		const newRule = {
			conditionGroup: null,
			color: "#000000",
		};
  
		this.optionsDefsList.push(newRule);
		
		this.setupItems();
		try {
			this.reRender();
		} catch (e) {
			console.error("Error during reRender:", e);
		}
		
		this.setupItemViews();

		this.trigger("change");
	}
  
	removeItem(num) {
		this.optionsDefsList.splice(num, 1);
		this.setupItems();
  
		this.clearView("nestedView" + this.optionsDefsList.length);
  
		if (this.isRendered()) {
			this.reRender();
		}
  
		this.setupItemViews();
  
		this.trigger("change");
	}
  
	override fetch() {
		const data = {};
  
		data[this.name] = this.optionsDefsList;
  
		if (!this.optionsDefsList.length) {
			data[this.name] = null;
		}
  
		return data;
	}
});
