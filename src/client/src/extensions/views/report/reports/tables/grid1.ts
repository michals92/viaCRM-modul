/* global Handlebars */

import type Grid1ReportView from 'espocrm/src/modules/advanced/src/views/report/reports/tables/grid1';
import type Model from 'espocrm/src/model';

interface ReportResult {
	groupByList: string[];
	columnList: string[];
	subListColumnList?: string[];
	summaryColumnList: string[];
	isJoint: boolean;
	grouping: string[][];
	reportData: Record<string, Record<string, unknown>>;
	subListData: Record<string, Array<Record<string, unknown>>>;
	sums: Record<string, number>;
}

interface ReportHelper {
	formatColumn(col: string, result: ReportResult): string;
	formatGroup(groupBy: string, gr: string, result: ReportResult): string;
	getGroupFieldData(groupBy: string, result: ReportResult): { fieldType: string; entityType: string; field: string };
	isColumnNumeric(col: string, result: ReportResult): boolean;
	isColumnAggregated(col: string, result: ReportResult): boolean;
}

interface ParentView {
	options: {
		model: Model;
		hasChart?: boolean;
		isLargeMode?: boolean;
		reportHelper: ReportHelper;
	};
}

extend<Grid1ReportView>(Dep => class extends Dep {
	result!: ReportResult;
	reportHelper!: ReportHelper;
	STUB_KEY!: string;
	columnWidthPx!: number;
	options!: {
		hasChart?: boolean;
		isLargeMode?: boolean;
		reportHelper: ReportHelper;
	};

	// Allows linkMultiple field types in reports. This has to be accompanied with a custom report that prepares the data in the backend.
	formatCellValue(value: unknown, column: string, isTotal: boolean, rowData?: Record<string, unknown>): string {
		const model = (this.getParentView() as ParentView)?.options.model;

		if (!model) {
			return super.formatCellValue(value, column, isTotal);
		}

		const fieldType = this.getMetadata().get(['entityDefs', model.get('entityType') as string, 'fields', column, 'type']) as string;
		const foreignEntity = this.getMetadata().get([
			'entityDefs',
			model.get('entityType') as string,
			'links',
			column,
			'entity',
		]) as string;

		if (column === 'name') {
			const id = rowData?.id as string;
			const name = value as string;

			if (name) {
				const $a = $('<a>')
					.attr('href', this.getUrl(id, model.get('entityType') as string))
					.attr('data-id', id)
					.text(name);

				const iconHtml = this.getHelper().getScopeColorIconHtml(model.get('entityType') as string);

				if (iconHtml) {
					$a.prepend(iconHtml);
				}

				return $a.prop('outerHTML') ?? '';
			} else {
				return value as string;
			}
		} else if (fieldType === 'link' && foreignEntity) {
			const id = rowData?.[column + 'Id'] as string;
			const name = rowData?.[column + 'Name'] as string;

			if (id) {
				const $a = $('<a>').attr('href', this.getUrl(id, foreignEntity)).attr('data-id', id).text(name);

				const iconHtml = this.getHelper().getScopeColorIconHtml(foreignEntity);

				if (iconHtml) {
					$a.prepend(iconHtml);
				}

				return $a.prop('outerHTML') ?? '';
			} else {
				return value as string;
			}
		} else if (fieldType === 'linkMultiple' && foreignEntity) {
			const ids = (rowData?.[column + 'Ids'] || []) as string[];
			const names = (rowData?.[column + 'Names'] || {}) as Record<string, string>;

			const $container = $('<div>');

			const iconHtml = this.getHelper().getScopeColorIconHtml(foreignEntity);

			ids.forEach((id: string) => {
				const name = names[id] || id;

				const $a = $('<a>').attr('href', this.getUrl(id, foreignEntity)).attr('data-id', id).text(name);

				if (iconHtml) {
					$a.prepend(iconHtml);
				}

				$container.append($a);
			});

			return $container.html() ?? '';
		} else {
			return super.formatCellValue(value, column, isTotal);
		}
	}

	getUrl(id: string, foreignEntity: string): string {
		return '#' + foreignEntity + '/view/' + id;
	}

	afterRender(): void {
		let result = this.result;

		let groupBy = this.result.groupByList[0];

		let noGroup = false;

		if (this.result.groupByList.length === 0) {
			noGroup = true;
			groupBy = this.STUB_KEY;
		}

		let columnCount = this.result.columnList.length + 1;

		let columnWidth = this.calculateColumnWidth();

		let $table = $('<table style="table-layout: fixed;">')
			.addClass('table table-no-overflow')
			.addClass('table-bordered');

		let $tbody = $('<tbody>');

		$table.append($tbody);

		let columnWidthPx = this.columnWidthPx;

		if (columnCount > 4) {
			var tableWidthPx = columnWidthPx * columnCount;

			$table.css('min-width', tableWidthPx + 'px');
		}

		if (!this.options.hasChart || this.options.isLargeMode) {
			$table.addClass('no-margin');
		}

		let $tr = $('<tr class="accented">');

		let hasSubListColumns = (this.result.subListColumnList || []).length;

		if (!noGroup) {
			let $th = $('<th>');

			if (!~groupBy.indexOf(':') && (this.result.isJoint || hasSubListColumns)) {
				let columnData = this.reportHelper.getGroupFieldData(groupBy, this.result);

				let columnString: string | null = null;

				if (columnData.fieldType === 'link') {
					let foreignEntityType = this.getMetadata().get([
						'entityDefs',
						columnData.entityType,
						'links',
						columnData.field,
						'entity',
					]) as string;

					if (foreignEntityType) {
						columnString = this.translate(foreignEntityType, 'scopeNames') as string;
					}
				}

				if (columnString) {
					columnString = '<strong class="text-soft">' + columnString + '</strong>';
					$th.html(columnString);

					if (this.options.isLargeMode && noGroup && this.result.columnList.length < 3) {
						const multiplier = (this.getConfig().get('reportSmallModeFontPercentage') as number) ?? 125;

						$th.css('font-size', multiplier + '%');
					}
				}
			}

			$tr.append($th);
		}

		this.result.columnList.forEach((col: string) => {
			let columnString = this.reportHelper.formatColumn(col, this.result);

			columnString = '<strong class="text-soft">' + columnString + '</strong>';

			let $th = $('<th width="' + columnWidth + '%">').html(columnString + '&nbsp;');

			$th.css('font-weight', '600');

			if (this.options.isLargeMode && noGroup && !hasSubListColumns && this.result.columnList.length < 3) {
				const multiplier = (this.getConfig().get('reportSmallModeFontPercentage') as number) ?? 125;

				$th.css('font-size', multiplier + '%');
			}

			$tr.append($th);
		});

		$tbody.append($tr);

		this.result.grouping[0].forEach((gr: string) => {
			let $tr = $('<tr>');

			if (hasSubListColumns) {
				$tr.addClass('accented');
			}

			let groupTitle: string;

			if (!noGroup) {
				groupTitle = this.reportHelper.formatGroup(groupBy, gr, this.result);

				let html = groupTitle;

				if (!this.result.isJoint) {
					html =
						'<a role="button" tabindex="0" data-action="showSubReport"' +
						' data-group-value="' +
						Handlebars.Utils.escapeExpression(gr) +
						'">' +
						html +
						'</a>&nbsp;';
				}

				let $td = $('<td>').html(html);

				if (hasSubListColumns) {
					$td.css('font-weight', '600');
				}

				$tr.append($td);

				if (hasSubListColumns) {
					this.result.columnList.forEach((col: string) => {
						let $td = $('<td>');

						if (!this.options.reportHelper.isColumnNumeric(col, this.result)) {
							let itemData = this.result.reportData[gr] || {};

							let formattedValue = this.formatCellValue(itemData[col] || '', col, false, itemData);

							$td.text(formattedValue);
							$td.attr('title', formattedValue);
						}

						$tr.append($td);
					});

					$tbody.append($tr);

					$tr = $('<tr>');

					let $td = $('<td>');

					$td.addClass('text-soft');

					$td.html(this.translate('Group Total', 'labels', 'Report') as string);

					$tr.append($td);
				}
			}

			if (hasSubListColumns) {
				let recordList = this.result.subListData[gr];

				recordList.forEach((recordItem: Record<string, unknown>) => {
					let $tr = $('<tr>');

					if (!noGroup) {
						$tr.append('<td>');
					}

					this.result.columnList.forEach((col: string) => {
						let $td = $('<td>');

						if (!~this.result.subListColumnList!.indexOf(col)) {
							$tr.append('<td>');

							return;
						}

						if (this.options.reportHelper.isColumnNumeric(col, this.result)) {
							$td.attr('align', 'right');
						}

						let value = recordItem[col];

						let formattedValue = this.formatCellValue(value, col, false, recordItem);

						$td.html(formattedValue);
						$td.attr('title', formattedValue);

						if (formattedValue === '') {
							$td.html('&nbsp;');
						}

						$tr.append($td);
					});

					$tbody.append($tr);
				});
			}

			let hasGroupTotal = false;

			this.result.columnList.forEach((col: string) => {
				let value: unknown = null;
				let toSkip = false;

				if (gr in result.reportData) {
					value = result.reportData[gr][col];
				}

				let $td = $('<td>');

				if (this.options.reportHelper.isColumnNumeric(col, this.result)) {
					$td.attr('align', 'right');
				}

				if (noGroup) {
					$td.css('font-weight', '600');
					$td.addClass('text-soft');

					if (this.options.isLargeMode) {
						const multiplier = (this.getConfig().get('reportLargeModeFontPercentage') as number) ?? 175;

						$td.css('font-size', multiplier + '%');
					} else if (!hasSubListColumns) {
						const multiplier = (this.getConfig().get('reportSmallModeFontPercentage') as number) ?? 125;

						$td.css('font-size', multiplier + '%');
					}
				} else {
					let columnString = this.reportHelper.formatColumn(col, this.result);

					let title = this.unescapeString(groupTitle!) + '\n' + this.unescapeString(columnString);

					$td.attr('title', title);

					if (hasSubListColumns && this.options.reportHelper.isColumnNumeric(col, this.result)) {
						$td.css('font-weight', '600');
						$td.addClass('text-soft');

						hasGroupTotal = true;
					}

					if (hasSubListColumns && !this.options.reportHelper.isColumnNumeric(col, this.result)) {
						toSkip = true;
					}

					if (hasSubListColumns && !this.options.reportHelper.isColumnAggregated(col, this.result)) {
						toSkip = true;
					}
				}

				let formattedValue = !toSkip ? this.formatCellValue(value, col, false, result.reportData[gr]) : '';

				$td.html(formattedValue);

				$tr.append($td);
			});

			if (this.result.summaryColumnList.length !== 0 || hasGroupTotal) {
				$tbody.append($tr);
			}
		});

		if (!noGroup) {
			$tr = $('<tr class="accented">');

			let $text = $('<span>' + (this.translate('Total', 'labels', 'Report') as string) + '</span>');

			let $td = $('<td>').html($text as unknown as string).addClass('text-soft').css('font-weight', '600');

			$tr.append($td);

			if (this.options.isLargeMode) {
				$text.css('vertical-align', 'middle');
			}

			this.result.columnList.forEach((col: string) => {
				let value = result.sums[col];

				let cellValue: string;

				let columnString = this.reportHelper.formatColumn(col, this.result);

				if (
					this.options.reportHelper.isColumnNumeric(col, this.result) &&
					this.options.reportHelper.isColumnAggregated(col, this.result)
				) {
					value = value || 0;

					cellValue = this.formatCellValue(value, col, true, result.sums);
				} else {
					cellValue = '';
				}

				let $td = $('<td align="right">').css('font-weight', '600').html(cellValue);

				if (this.options.isLargeMode) {
					const multiplier = (this.getConfig().get('reportSmallModeFontPercentage') as number) ?? 125;

					$td.css('font-size', multiplier + '%');
				}

				let title = this.unescapeString(columnString);

				$td.attr('title', title);

				$tr.append($td);
			});

			$tbody.append($tr);
		}

		this.$el.find('.table-container').append($table);

		if (columnCount > 4) {
			this.$el.find('.table-container').css('overflow-y', 'auto');
		}
	}
});
