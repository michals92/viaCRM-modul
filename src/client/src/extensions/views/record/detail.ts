import type DetailRecordView from 'espocrm/src/views/record/detail';

type ClientDefs = {
	isWide?: boolean;
	gridLayoutType?: string;
	showCurrencyConvertInDetail?: boolean;
	hidePdfButtonsInDetail?: boolean;
};

type LayoutPanel = {
	name: string;
	rows: Array<Array<CellDef | null>>;
	css?: string;
	index?: number;
};

type CellDef = {
	field?: string;
	css?: string;
	fullWidth?: boolean;
	color?: string;
	horizontalLabel?: boolean;
	bold?: boolean;
};

type MiddlePanelDef = {
	tabNumber?: number;
	tabIconClass?: string;
	tabColor?: string;
	[key: string]: unknown;
};

type FieldView = {
	$el: JQuery;
	on(event: string, callback: () => void): void;
	get$cell?(): JQuery;
	getCellElement?(): JQuery;
};

type BottomView = {
	trigger(event: string, data: string): void;
	$el: JQuery;
};

type GridLayout = {
	layout?: LayoutPanel[];
};

type DropdownItem = {
	name?: string;
	style?: string;
	html?: string;
	label?: string;
};

extend<DetailRecordView>(Dep => class extends Dep {
	customLayoutTypes = ['tab', 'record'];

	override template = 'viacrm:record/detail';

	declare scope: string;
	declare type: string;
	declare isWide: boolean;
	declare gridLayoutType: string;
	declare middlePanelDefs: Record<string, MiddlePanelDef>;
	declare middlePanelDefsList: MiddlePanelDef[];
	declare model: { name: string; id: string };
	declare options: {
		isWide?: boolean;
		gridLayoutType?: string;
		[key: string]: unknown;
	};
	declare events: Record<string, (e: JQuery.TriggeredEvent) => void>;

	override setup(): void {
		super.setup();

		this.setupEvents();

		const clientDefs = (this.getMetadata().get(['clientDefs', this.scope], {}) as ClientDefs);

		if (!('isWide' in this.options)) {
			if (clientDefs && 'isWide' in clientDefs) {
				this.isWide = clientDefs.isWide!;
			} else if (this.getConfig().get('defaultIsWide')) {
				this.isWide = true;
			}
		}

		if (this.type === 'editSmall' || this.type === 'detailSmall') {
			return;
		}

		// Deprecated TODO: remove
		if (!('gridLayoutType' in this.options)) {
			if ('gridLayoutType' in clientDefs) {
				this.gridLayoutType = clientDefs.gridLayoutType!;
			}
		} else {
			this.gridLayoutType = this.options.gridLayoutType!;
		}

		this.gridLayoutType = this.gridLayoutType || (this.getConfig().get('defaultDetailLayout') as string);

		if (this.customLayoutTypes.includes(this.gridLayoutType)) {
			this.gridLayoutType = 'viacrm:' + this.gridLayoutType;
		}
	}

	setupEvents(): void {
		this.events['click .panel-tabs li[id^="tablink-"]'] = (e: JQuery.TriggeredEvent) => {
			const $li = $(e.currentTarget as HTMLElement);

			const liId = $li.attr('id');
			const numberStr = liId!.split('-')[1];

			this.onSelectTab(numberStr);
		};
	}

	onSelectTab(tab: string): void {
		const bottomView = this.getView('bottom') as BottomView | null;

		if (bottomView) {
			bottomView.trigger('tab-selected', tab);
		}
	}

	override afterSave(): void {
		this.model.trigger('update-all');

		super.afterSave();
	}

	override convertDetailLayout(simplifiedLayout: Array<LayoutPanel & { css?: string; tabIconClass?: string; tabColor?: string }>): LayoutPanel[] {
		const layout = super.convertDetailLayout(simplifiedLayout) as LayoutPanel[];

		this.middlePanelDefsList = [];

		layout.forEach((panel: LayoutPanel, _p: number) => {
			panel.css = simplifiedLayout[_p].css || 'col-md-12';

			panel.rows.forEach((rowCells: Array<CellDef | null>, _r: number) => {
				const defaultCol = 12 / rowCells.length;

				rowCells.forEach((cell: CellDef | null, _c: number) => {
					const cellDefs = simplifiedLayout[_p].rows[_r][_c] || {} as CellDef;

					if (!cell) {
						return;
					}

					(cell as CellDef & { css: string }).css = cellDefs.css || (cellDefs.fullWidth ? 'col-md-12' : 'col-md-' + defaultCol);

					if ('color' in cellDefs) {
						cell.color = cellDefs.color;
					}
					if ('horizontalLabel' in cellDefs) {
						cell.horizontalLabel = cellDefs.horizontalLabel;
					}

					cell.bold = cellDefs.bold;
				});
			});

			panel.index = simplifiedLayout[_p].index;

			if (panel.index === undefined) {
				panel.index = _p;
			}

			const middlePanel = this.middlePanelDefs[panel.name];

			middlePanel.tabIconClass = simplifiedLayout[_p].tabIconClass;
			middlePanel.tabColor = simplifiedLayout[_p].tabColor;

			this.middlePanelDefs[panel.name] = middlePanel;
			this.middlePanelDefsList.push(middlePanel);
		});

		layout.sort((a: LayoutPanel, b: LayoutPanel) => (a.index || 0) - (b.index || 0));

		return layout;
	}

	override afterRender(): void {
		super.afterRender();

		this.getGridLayout((grid: GridLayout) => {
			(grid.layout || []).forEach((panel: LayoutPanel) => {
				panel.rows.forEach((row: Array<CellDef | null>) => {
					row.forEach(this.processCell.bind(this));
				});
			});
		});

		if (this.gridLayoutType === 'viacrm:tab' && this.hasView('bottom')) {
			const firstPanel = (this.getView('bottom') as BottomView).$el.children('.panel').first();

			if (firstPanel.length && firstPanel.hasClass('sticked')) {
				firstPanel.removeClass('sticked');
			}
		}
	}

	processCell(cell: (CellDef & { field?: string; css?: string }) | null): void {
		if (!cell) {
			return;
		}

		const view = this.getFieldView(cell.field!) as FieldView | null;

		if (!view) {
			return;
		}

		const css: Record<string, string> = {};

		if ('color' in cell) {
			css.color = cell.color!;
		}

		if (cell.bold) {
			css['font-weight'] = 'bold';
		}

		if (cell.css) {
			// use get$cell if available, otherwise fall back to old getCellElement
			const $cell = typeof view.get$cell === 'function' ? view.get$cell() : view.getCellElement!();

			$cell.addClass(cell.css);
		}

		view.$el.css(css).find('input, select, a').css(css);

		if (css.color) {
			view.on('after:render', () => {
				view.$el.css(css).find('input, select, a').css(css);
			});
		}
	}

	override getMiddleTabDataList(): Array<{ tabIconClass?: string; tabColor?: string }> {
		const panelDataList = this.middlePanelDefsList;

		return (super.getMiddleTabDataList() as Array<{ tabIconClass?: string; tabColor?: string }>).map((item, i: number) => {
			const panel = panelDataList.find((p: MiddlePanelDef) => p.tabNumber === i);

			item.tabIconClass = panel?.tabIconClass;
			item.tabColor = panel?.tabColor;

			return item;
		});
	}

	override addDropdownItem(o: DropdownItem | null, toBeginning?: boolean): void {
		if (o &&
				o.name === 'convertCurrency' && this.getMetadata().get(['clientDefs', this.scope, 'showCurrencyConvertInDetail'], false)) {
			this.addButton({
				name: 'convertCurrency',
				label: 'Convert Currency',
				style: 'info',
				html:
						"<span class='fas fa-money-bill-alt convert-currency-icon'></span>" +
						' ' +
						this.translate('Convert Currency'),
			});
		}

		// Exception for printPdf
		if (
			o &&
				o.name === 'printPdf' &&
				!this.getMetadata().get(['clientDefs', this.scope, 'hidePdfButtonsInDetail'], false)
		) {
			// If we don't pass acl for printing, do not add even the original printPdf button to the dropdown

			if (this.getAcl().checkScope(this.scope, 'print')) {
				Object.assign(o, {
					style: 'primary',
					html: "<span class='fas fa-print print-pdf-icon'></span>" + this.translate('Print to PDF'),
				});

				this.addButton(o, toBeginning);

				// Anywhere where there is a printPdf button, there should be an emailPdf button
				this.addButton({
					name: 'emailPdf',
					label: 'Email PDF',
					style: 'info',
					html: "<span class='fas fa-at email-pdf-icon'></span>" + this.translate('Email PDF'),
				});

				super.addDropdownItem(o, toBeginning);
			}
		} else {
			super.addDropdownItem(o, toBeginning);
		}
	}

	actionEmailPdf(): void {
		this.createView(
			'pdfTemplate',
			'views/modals/select-template',
			{
				entityType: this.model.name,
			},
			(view: { render: () => void }) => {
				view.render();

				this.listenToOnce(view, 'select', (model: { id: string }) => {
					Espo.Ui.notifyWait();

					Espo.Ajax.getRequest('EmailPdf/getAttributes', {
						entityType: this.model.name,
						id: this.model.id,
						templateId: model.id,
					}).then((attributes: Record<string, unknown>) => {
						const viewName =
								(this.getMetadata().get(['clientDefs', 'Email', 'modalViews', 'compose']) as string) ||
								'views/modals/compose-email';

						this.createView(
							'composeEmail',
							viewName,
							{
								attributes,
								keepAttachmentsOnSelectTemplate: true,
								appendSignature: true,
							},
							(composeView: { render: () => void }) => {
								composeView.render();
								this.notify(false);
							},
						);
					});
				});
			},
		);
	}
});
