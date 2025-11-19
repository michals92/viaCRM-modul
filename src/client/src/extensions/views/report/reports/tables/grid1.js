/* global Handlebars */

extend(Dep => class extends Dep {
	// Allows linkMultiple field types in reports. This has to be accompanied with a custom report that prepares the data in the backend.
	formatCellValue(value, column, isTotal, rowData) {
		const model = this.getParentView().options.model;

		if (!model) {
			return super.formatCellValue(value, column, isTotal);
		}

		const fieldType = this.getMetadata().get(['entityDefs', model.get('entityType'), 'fields', column, 'type']);
		const foreignEntity = this.getMetadata().get([
			'entityDefs',
			model.get('entityType'),
			'links',
			column,
			'entity',
		]);

		if (column === 'name') {
			const id = rowData.id;
			const name = value;

			if (name) {
				const $a = $('<a>')
					.attr('href', this.getUrl(id, model.get('entityType')))
					.attr('data-id', id)
					.text(name);

				const iconHtml = this.getHelper().getScopeColorIconHtml(model.get('entityType'));

				if (iconHtml) {
					$a.prepend(iconHtml);
				}

				return $a.prop('outerHTML');
			} else {
				return value;
			}
		} else if (fieldType === 'link' && foreignEntity) {
			const id = rowData[column + 'Id'];
			const name = rowData[column + 'Name'];

			if (id) {
				const $a = $('<a>').attr('href', this.getUrl(id, foreignEntity)).attr('data-id', id).text(name);

				const iconHtml = this.getHelper().getScopeColorIconHtml(foreignEntity);

				if (iconHtml) {
					$a.prepend(iconHtml);
				}

				return $a.prop('outerHTML');
			} else {
				return value;
			}
		} else if (fieldType === 'linkMultiple' && foreignEntity) {
			const ids = rowData[column + 'Ids'] || [];
			const names = rowData[column + 'Names'] || {};

			const $container = $('<div>');

			const iconHtml = this.getHelper().getScopeColorIconHtml(foreignEntity);

			ids.forEach(id => {
				const name = names[id] || id;

				const $a = $('<a>').attr('href', this.getUrl(id, foreignEntity)).attr('data-id', id).text(name);

				if (iconHtml) {
					$a.prepend(iconHtml);
				}

				$container.append($a);
			});

			return $container.html();
		} else {
			return super.formatCellValue(value, column, isTotal);
		}
	}

	getUrl(id, foreignEntity) {
		return '#' + foreignEntity + '/view/' + id;
	}

	afterRender() {
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
			//this.$el.addClass('no-bottom-margin');
		}

		let $tr = $('<tr class="accented">');

		let hasSubListColumns = (this.result.subListColumnList || []).length;

		if (!noGroup) {
			let $th = $('<th>');

			if (!~groupBy.indexOf(':') && (this.result.isJoint || hasSubListColumns)) {
				let columnData = this.reportHelper.getGroupFieldData(groupBy, this.result);

				let columnString = null;

				if (columnData.fieldType === 'link') {
					let foreignEntityType = this.getMetadata().get([
						'entityDefs',
						columnData.entityType,
						'links',
						columnData.field,
						'entity',
					]);

					if (foreignEntityType) {
						columnString = this.translate(foreignEntityType, 'scopeNames');
					}
				}

				if (columnString) {
					columnString = '<strong class="text-soft">' + columnString + '</strong>';
					$th.html(columnString);

					if (this.options.isLargeMode && noGroup && this.result.columnList.length < 3) {
						const multiplier = this.getConfig().get('reportSmallModeFontPercentage') ?? 125;

						$th.css('font-size', multiplier + '%');
					}
				}
			}

			$tr.append($th);
		}

		this.result.columnList.forEach(col => {
			let columnString = this.reportHelper.formatColumn(col, this.result);

			columnString = '<strong class="text-soft">' + columnString + '</strong>';

			let $th = $('<th width="' + columnWidth + '%">').html(columnString + '&nbsp;');

			$th.css('font-weight', '600');

			if (this.options.isLargeMode && noGroup && !hasSubListColumns && this.result.columnList.length < 3) {
				const multiplier = this.getConfig().get('reportSmallModeFontPercentage') ?? 125;

				$th.css('font-size', multiplier + '%');
			}

			$tr.append($th);
		});

		$tbody.append($tr);

		this.result.grouping[0].forEach(gr => {
			let $tr = $('<tr>');

			if (hasSubListColumns) {
				$tr.addClass('accented');
			}

			let groupTitle;

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
					this.result.columnList.forEach(col => {
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

					$td.html(this.translate('Group Total', 'labels', 'Report'));

					$tr.append($td);
				}
			}

			if (hasSubListColumns) {
				let recordList = this.result.subListData[gr];

				recordList.forEach(recordItem => {
					let $tr = $('<tr>');

					if (!noGroup) {
						$tr.append('<td>');
					}

					this.result.columnList.forEach(col => {
						let $td = $('<td>');

						if (!~this.result.subListColumnList.indexOf(col)) {
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

			this.result.columnList.forEach(col => {
				let value = null;
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
						const multiplier = this.getConfig().get('reportLargeModeFontPercentage') ?? 175;

						$td.css('font-size', multiplier + '%');
					} else if (!hasSubListColumns) {
						const multiplier = this.getConfig().get('reportSmallModeFontPercentage') ?? 125;

						$td.css('font-size', multiplier + '%');
					}
				} else {
					let columnString = this.reportHelper.formatColumn(col, this.result);

					let title = this.unescapeString(groupTitle) + '\n' + this.unescapeString(columnString);

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

			let $text = $('<span>' + this.translate('Total', 'labels', 'Report') + '</span>');

			let $td = $('<td>').html($text).addClass('text-soft').css('font-weight', '600');

			$tr.append($td);

			if (this.options.isLargeMode) {
				$text.css('vertical-align', 'middle');
			}

			this.result.columnList.forEach(col => {
				let value = result.sums[col];

				let cellValue = value;

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
					const multiplier = this.getConfig().get('reportSmallModeFontPercentage') ?? 125;

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
