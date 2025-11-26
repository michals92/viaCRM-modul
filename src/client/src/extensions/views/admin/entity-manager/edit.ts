import type EntityManagerEditView from 'espocrm/src/views/admin/entity-manager/edit';

type LayoutCell = {
	name: string;
	fullWidth?: boolean;
} | false;

type LayoutRow = LayoutCell[];

type LayoutPanel = {
	label: string;
	rows: LayoutRow[];
};

type AdditionalParams = Record<string, {
	hidden?: boolean;
	fullWidth?: boolean;
}>;

extend<EntityManagerEditView>(Dep => class extends Dep {
	layoutBase: LayoutPanel[] = [
		{
			label: 'Basic Settings',
			rows: [
				[
					{ name: 'name' },
					{ name: 'type' }
				],
				[
					{ name: 'labelSingular' },
					{ name: 'labelPlural' }
				],
				[
					{ name: 'iconClass' },
					{ name: 'color' }
				],
				[
					{ name: 'disabled' },
					{ name: 'stream' }
				],
				[
					{ name: 'stars' },
					{ name: 'optimisticConcurrencyControl' }
				],
				[
					{ name: 'preserveAuditLog' },
					{ name: 'assignedUsers' }
				],
				[
					{ name: 'collaborators' },
					false
				]
			]
		},
		{
			label: 'List View Settings',
			rows: [
				[
					{ name: 'sortBy' },
					{ name: 'sortDirection' }
				],
				[
					{ name: 'countDisabled' },
					{ name: 'listDefaultViewMode' }
				],
				[
					{ name: 'gridViewMode' },
					{ name: 'partitionedViewMode' }
				],
				[
					{ name: 'listHeaderLabel' },
					{ name: 'filterHeaderLabel' }
				]
			]
		},
		{
			label: 'Kanban View',
			rows: [
				[
					{ name: 'kanbanViewMode' },
					{ name: 'kanbanStatusIgnoreList' }
				],
				[
					{ name: 'userKanbanViewMode' },
					{ name: 'userKanbanStatusIgnoreList' }
				]
			]
		},
		{
			label: 'Detail View Settings',
			rows: [
				[
					{ name: 'detailDefaultViewMode' },
					{ name: 'isWide' }
				],
				[
					{ name: 'attachmentCompareViewMode' },
					{ name: 'attachmentCompareViewModeField' }
				]
			]
		},
		{
			label: 'Search & Filtering',
			rows: [
				[
					{ name: 'textFilterFields' },
					{ name: 'statusField' }
				],
				[
					{ name: 'fullTextSearch' },
					{ name: 'fullTextSearchMode' }
				],
				[
					{ name: 'fullTextMinWordLength' },
					{ name: 'fullTextSearchEscapeSpecialCharacters' }
				],
				[
					{ name: 'globalSearchDisplayFields' },
					false
				],
				[
					{ name: 'defaultAdvancedFilters', fullWidth: true }
				],
				[
					{ name: 'defaultFilterData', fullWidth: true }
				]
			]
		},
		{
			label: 'PDF & Export',
			rows: [
				[
					{ name: 'pdfNameField' },
					{ name: 'hidePdfButtonsInDetail' }
				]
			]
		},
		{
			label: 'Duplicate Checking',
			rows: [
				[
					{ name: 'updateDuplicateCheck' },
					{ name: 'duplicateCheckFieldList' }
				],
				[
					{ name: 'duplicateCheckCreateButtonDisabled' },
					false
				]
			]
		},
		{
			label: 'Access Control',
			rows: [
				[
					{ name: 'aclContactLink' },
					{ name: 'aclAccountLink' }
				]
			]
		},
		{
			label: 'Other Settings',
			rows: [
				[
					{ name: 'showCurrencyConvertInDetail' },
					{ name: 'defaultEmailTemplate' }
				]
			]
		}
	];

	declare scope: string;
	declare detailLayout: LayoutPanel[];
	declare additionalParams: AdditionalParams | undefined;

	override setupData(): void {
		super.setupData();

		if (!this.scope) {
			return;
		}

		// Save the parent's layout as ground truth
		const parentLayout = this.detailLayout;

		// Build a map of field name -> complete cell from parent layout
		const parentCellMap = new Map<string, LayoutCell>();
		parentLayout.forEach((panel: LayoutPanel) => {
			panel.rows.forEach((row: LayoutRow) => {
				row.forEach((cell: LayoutCell) => {
					if (cell && typeof cell === 'object' && cell.name) {
						parentCellMap.set(cell.name, cell);
					}
				});
			});
		});

		// Build our custom panels by re-arranging cells from parent
		const customPanels = this.layoutBase
			.map(panel => ({
				...panel,
				rows: panel.rows
					.map(row =>
						row.map(cell => {
							if (!cell || cell === false) {
								return cell;
							}

							const fieldName = cell.name;
							const parentCell = parentCellMap.get(fieldName);

							// Only include fields that exist in parent layout
							if (!parentCell) {
								return null;
							}

							// Merge with parent cell (parent options take precedence)
							return {
								...cell,
								...parentCell
							};
						})
							.filter((cell): cell is LayoutCell => cell !== null)
					)
					.filter(row => row.length > 0)
					.map(row => {
						// Add false placeholder if row has only 1 cell
						if (row.length === 1 && row[0] !== false) {
							return [...row, false] as LayoutRow;
						}
						return row;
					})
			}))
			.filter(panel => panel.rows.length > 0);

		// Find fields that we haven't placed yet
		const placedFields = new Set<string>();
		customPanels.forEach(panel => {
			panel.rows.forEach(row => {
				row.forEach(cell => {
					if (cell && typeof cell === 'object' && cell.name) {
						placedFields.add(cell.name);
					}
				});
			});
		});

		// Collect unmapped cells for "Other Settings"
		const unmappedCells: LayoutCell[] = [];
		parentCellMap.forEach((cell, name) => {
			if (!placedFields.has(name)) {
				// Skip if explicitly hidden via additionalParams
				if (this.additionalParams?.[name]?.hidden === true) {
					return;
				}
				unmappedCells.push(cell);
			}
		});

		this.detailLayout = customPanels;

		// Append unmapped cells to "Other Settings" panel if any exist
		if (unmappedCells.length > 0) {
			const rows: LayoutRow[] = [];

			unmappedCells.forEach((cell, i) => {
				if (cell && typeof cell === 'object') {
					if (this.additionalParams?.[cell.name]?.fullWidth || cell.fullWidth) {
						rows.push([{ ...cell, fullWidth: true }]);
						return;
					}

					if (rows.length === 0 || rows[rows.length - 1].length === 2) {
						rows.push([]);
					}

					const row = rows[rows.length - 1];
					row.push(cell);

					if (row.length === 1 && i === unmappedCells.length - 1) {
						row.push(false);
					}
				}
			});

			// Find or append to "Other Settings" panel
			const otherSettingsPanel = this.detailLayout.find(panel => panel.label === 'Other Settings');

			if (otherSettingsPanel) {
				otherSettingsPanel.rows.push(...rows);
			} else {
				this.detailLayout.push({
					label: 'Other Settings',
					rows: rows
				});
			}
		}
	}
});
