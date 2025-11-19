extend(Dep => class extends Dep {
	init() {
		super.init();

		if (!this.buttonList.some(button => button.name === 'addRelatedField')) {
			this.buttonList.push({
				name: 'addRelatedField',
				label: 'Add Related Field',
			});
		}

		if (!this.dataAttributeList.includes('isEditable')) {
			this.dataAttributeList.push('isEditable');
		}

		if (!this.dataAttributeList.includes('breakText')) {
			this.dataAttributeList.push('breakText');
		}
	}

	setup() {
		this.events['click button[data-action="addRelatedField"]'] = () => this.openAddFieldDialog();

		this.dataAttributesDefs.isEditable = {
			type: 'bool',
			default: false,
			tooltip: true,
		};

		this.dataAttributesDefs.breakText = {
			type: 'bool',
			default: false,
			tooltip: false,
		};

		super.setup();
	}

	readDataFromLayout(model, layout) {
		super.readDataFromLayout(model, layout);

		this.translateRowLayout();
	}

	openAddFieldDialog() {
		const currentLayout = this.fetch();
		this.createView(
			'modal',
			'autocrm:views/admin/layouts/modals/add-related-field',
			{
				scope: this.scope,
				enabledFields: currentLayout,
			},
			view => {
				view.render();

				this.listenToOnce(view, 'add-field', (attributeName, attributeNameTranslated) => {
					this.rowLayout = currentLayout;

					this.translateRowLayout();

					const newRow = {
						label: attributeNameTranslated,
						name: attributeName,
						customLabel: attributeNameTranslated,
						notSortable: true,
					};
					this.rowLayout.push(newRow);
					this.itemsData[attributeName] = Espo.Utils.cloneDeep(newRow);

					view.close();
					this.reRender();
					this.setIsChanged();
				});
			},
		);
	}

	translateLabel(name) {
		if (name.includes('.')) {
			const field = name.split('.')[1];
			const link = name.split('.')[0];
			const linkScope = this.getMetadata().get('entityDefs.' + this.scope + '.links.' + link + '.entity');
			return this.translate(link, 'links', this.scope) + ' > ' + this.translate(field, 'fields', linkScope);
		} else {
			return this.translate(name, 'fields', this.scope);
		}
	}

	translateRowLayout() {
		for (const i in this.rowLayout) {
			this.rowLayout[i].label = this.translateLabel(this.rowLayout[i].name);
		}
	}
});
