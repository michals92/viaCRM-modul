import type LayoutListView from 'espocrm/src/views/admin/layouts/list';

type ButtonDef = {
	name: string;
	label: string;
};

type LayoutRow = {
	label: string;
	name: string;
	customLabel?: string;
	notSortable?: boolean;
	[key: string]: unknown;
};

extend<LayoutListView>(Dep => class extends Dep {
	override init(): void {
		super.init();

		if (!this.buttonList.some((button: ButtonDef) => button.name === 'addRelatedField')) {
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

	override setup(): void {
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

	override readDataFromLayout(model: unknown, layout: unknown): void {
		super.readDataFromLayout(model, layout);

		this.translateRowLayout();
	}

	openAddFieldDialog(): void {
		const currentLayout = this.fetch() as LayoutRow[];
		this.createView(
			'modal',
			'viacrm:views/admin/layouts/modals/add-related-field',
			{
				scope: this.scope,
				enabledFields: currentLayout,
			},
			(view: { render: () => void; close: () => void }) => {
				view.render();

				this.listenToOnce(view, 'add-field', (attributeName: string, attributeNameTranslated: string) => {
					this.rowLayout = currentLayout;

					this.translateRowLayout();

					const newRow: LayoutRow = {
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

	translateLabel(name: string): string {
		if (name.includes('.')) {
			const field = name.split('.')[1];
			const link = name.split('.')[0];
			const linkScope = this.getMetadata().get('entityDefs.' + this.scope + '.links.' + link + '.entity') as string;
			return this.translate(link, 'links', this.scope) + ' > ' + this.translate(field, 'fields', linkScope);
		} else {
			return this.translate(name, 'fields', this.scope);
		}
	}

	translateRowLayout(): void {
		for (const i in this.rowLayout) {
			(this.rowLayout[i] as LayoutRow).label = this.translateLabel((this.rowLayout[i] as LayoutRow).name);
		}
	}
});
