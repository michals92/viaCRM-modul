extend(Dep => class extends Dep {
	customLayoutTypes = ['tab', 'record'];

	template = 'autocrm:record/detail';

	setup() {
		super.setup();

		this.setupEvents();

		const clientDefs = this.getMetadata().get(['clientDefs', this.scope], {});

		if (!('isWide' in this.options)) {
			if (clientDefs && 'isWide' in clientDefs) {
				this.isWide = clientDefs.isWide;
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
				this.gridLayoutType = clientDefs.gridLayoutType;
			}
		} else {
			this.gridLayoutType = this.options.gridLayoutType;
		}

		this.gridLayoutType = this.gridLayoutType || this.getConfig().get('defaultDetailLayout');

		if (this.customLayoutTypes.includes(this.gridLayoutType)) {
			this.gridLayoutType = 'autocrm:' + this.gridLayoutType;
		}
	}

	setupEvents() {
		this.events['click .panel-tabs li[id^="tablink-"]'] = e => {
			const $li = $(e.currentTarget);

			const liId = $li.attr('id');
			const numberStr = liId.split('-')[1];

			this.onSelectTab(numberStr);
		};
	}

	onSelectTab(tab) {
		const bottomView = this.getView('bottom');

		if (bottomView) {
			bottomView.trigger('tab-selected', tab);
		}
	}

	afterSave() {
		this.model.trigger('update-all');

		super.afterSave();
	}

	convertDetailLayout(simplifiedLayout) {
		const layout = super.convertDetailLayout(simplifiedLayout);

		this.middlePanelDefsList = [];

		layout.forEach((panel, _p) => {
			panel.css = simplifiedLayout[_p].css || 'col-md-12';

			panel.rows.forEach((rowCells, _r) => {
				const defaultCol = 12 / rowCells.length;

				rowCells.forEach((cell, _c) => {
					const cellDefs = simplifiedLayout[_p].rows[_r][_c] || {};

					if (!cell) {
						return;
					}

					cell.css = cellDefs.css || (cellDefs.fullWidth ? 'col-md-12' : 'col-md-' + defaultCol);

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

		layout.sort((a, b) => a.index - b.index);

		return layout;
	}

	afterRender() {
		super.afterRender();

		this.getGridLayout(grid => {
			(grid.layout || []).forEach(panel => {
				panel.rows.forEach(row => {
					row.forEach(this.processCell.bind(this));
				});
			});
		});

		if (this.gridLayoutType === 'autocrm:tab' && this.hasView('bottom')) {
			const firstPanel = this.getView('bottom').$el.children('.panel').first();

			if (firstPanel.length && firstPanel.hasClass('sticked')) {
				firstPanel.removeClass('sticked');
			}
		}
	}

	processCell(cell) {
		if (!cell) {
			return;
		}

		const view = this.getFieldView(cell.field);

		if (!view) {
			return;
		}

		const css = {};

		if ('color' in cell) {
			css.color = cell.color;
		}

		if (cell.bold) {
			css['font-weight'] = 'bold';
		}

		if (cell.css) {
			// use get$cell if available, otherwise fall back to old getCellElement
			const $cell = typeof view.get$cell === 'function' ? view.get$cell() : view.getCellElement();

			$cell.addClass(cell.css);
		}

		view.$el.css(css).find('input, select, a').css(css);

		if (css.color) {
			view.on('after:render', () => {
				view.$el.css(css).find('input, select, a').css(css);
			});
		}
	}

	getMiddleTabDataList() {
		const panelDataList = this.middlePanelDefsList;

		return super.getMiddleTabDataList().map((item, i) => {
			const panel = panelDataList.find(panel => panel.tabNumber === i);

			item.tabIconClass = panel.tabIconClass;
			item.tabColor = panel.tabColor;

			return item;
		});
	}

	addDropdownItem(o, toBeginning) {
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

	actionEmailPdf() {
		this.createView(
			'pdfTemplate',
			'views/modals/select-template',
			{
				entityType: this.model.name,
			},
			view => {
				view.render();

				this.listenToOnce(view, 'select', model => {
					Espo.Ui.notifyWait();

					Espo.Ajax.getRequest('EmailPdf/getAttributes', {
						entityType: this.model.name,
						id: this.model.id,
						templateId: model.id,
					}).then(attributes => {
						const viewName =
								this.getMetadata().get(['clientDefs', 'Email', 'modalViews', 'compose']) ||
								'views/modals/compose-email';

						this.createView(
							'composeEmail',
							viewName,
							{
								attributes,
								keepAttachmentsOnSelectTemplate: true,
								appendSignature: true,
							},
							view => {
								view.render();
								this.notify(false);
							},
						);
					});
				});
			},
		);
	}
});
