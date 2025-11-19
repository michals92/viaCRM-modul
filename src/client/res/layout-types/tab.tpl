<div class="tabs-layout">
	<!-- Nav tabs -->
	<div class="panel panel-tabs first panel-nav">
		<ul class="nav nav-tabs nav-justified" role="tablist">
			<% _.each(layout, function (panel, columnNumber) { %>
				<%
					var panelLabelString = 'Panel #' + columnNumber;

					if ('customLabel' in panel) {
						if (panel.customLabel) {
							panelLabelString = panel.customLabel;
						}
					} else {
						if (panel.label) {
							panelLabelString = "{{translate \"" + panel.label + "\" scope=\"" + model.name + "\"}}";
						}
					}
				%>
				<li
					role="presentation"
					id="tablink-<%= columnNumber %>"
					class="<% if (columnNumber == 0) print('active') %>"
					data-name="<%= panel.label %>"
				>
					<a
						href="#tabpanel-<%= columnNumber %>"
						aria-controls="<%= panel.label %>"
						role="tab"
						data-toggle="tab">
						<%= panelLabelString %>
					</a>
				</li>
			<% }); %>
		</ul>
	</div>
	<!-- Tab panes -->
	<div class="tab-content">
		<% _.each(layout, function (panel, columnNumber) { %>
			<div
				role="tabpanel"
				class="tab-pane fade <% if (columnNumber == 0) print('active in') %>"
				id="tabpanel-<%= columnNumber %>"
			>
				<div class="panel last sticked panel-<%= panel.style %><% if (panel.name) { %> {{#if hiddenPanels.<%= panel.name %>}}hidden{{/if}}<% } %>"
					<% if (panel.name) print(' data-name="' + panel.name + '"') %>>
					<%
					var panelLabelString = null;
					if ('customLabel' in panel) {
						if (panel.customLabel) {
							panelLabelString = panel.customLabel;
						}
					} else {
						if (panel.label) {
							panelLabelString = "{{translate \"" + panel.label + "\" scope=\"" + model.name + "\"}}";
						}
					}
					%>
					<div class="panel-body panel-body-form">

						<% var rows = panel.rows || [] %>
						<% var columns = panel.columns || [] %>

						<% _.each(rows, function (row, rowNumber) { %>
						<div class="row">
							<% var columnCount = row.length; %>
							<% _.each(row, function (cell, cellNumber) { %>

							<%
							var spanClassBase;
							if (columnCount === 1) {
								spanClassBase = 'col-sm-12';
							} else if (columnCount === 2) {
								spanClassBase = 'col-sm-6';
							} else if (columnCount === 3) {
								spanClassBase = 'col-sm-4';
							} else if (columnCount === 4) {
								spanClassBase = 'col-md-3 col-sm-6';
							} else {
								spanClass = 'col-sm-12';
							}
							%>
							<% if (cell != false) { %>
							<%
							var spanClass = cell.css;
							%>
							<div class="cell <%= spanClass %> form-group<% if (cell.field) { %> {{#if hiddenFields.<%= cell.field %>}}hidden-cell{{/if}}<% } %>"
								 data-name="<%= cell.field %>">
								<% if (!cell.noLabel) { %>
								<label class="control-label<% if (cell.field) { %> {{#if hiddenFields.<%= cell.field %>}}hidden{{/if}}<% } %>"
									   data-name="<%= cell.field %>">
									<span class="label-text">
										<%
										if ('customLabel' in cell) {
											print(cell.customLabel);
										} else {
											print("{{translate \"" + cell.field + "\" scope=\"" + model.name + "\" category='fields'}}");
										}
										%>
									</span>
								</label>
								<% } %>
								<div class="field<% if (cell.field) { %> {{#if hiddenFields.<%= cell.field %>}}hidden{{/if}}<% } %>"
									 data-name="<%= cell.field %>">
									<%
									if ('customCode' in cell) {
										print(cell.customCode);
									} else {
										print("{{{this." + cell.name + "}}}");
									}
									%>
								</div>
							</div>
							<% } else { %>
							<div class="<%= spanClassBase %>"></div>
							<% } %>
							<% }); %>
						</div>
						<% if (panel.rowData && panel.rowData[rowNumber] && panel.rowData[rowNumber].divider) { %>
							<% if (panel.rowData[rowNumber].dividerWidth && panel.rowData[rowNumber].dividerColor) { %>
								<div class="row">
									<div class="col-sm-12">
										<hr style="border-top-width: <%= panel.rowData[rowNumber].dividerWidth %>px; border-top-color: <%= panel.rowData[rowNumber].dividerColor %>;">
									</div>
								</div>
							<% } %>
						<% } %>
						<% }); %>

						<%
						var columnCount = columns.length;
						if (columnCount) {
						%>
						<div class="row">
						<%
						}
						%>
						<% _.each(columns, function (column, columnNumber) { %>
						<%
						var spanClass;
						if (!columnCount) return;

						if (columnCount === 1 || column.fullWidth) {
							spanClass = 'col-sm-12';
						} else if (columnCount === 2) {
							if (column.span === 2) {
								spanClass = 'col-sm-12';
							} else {
								spanClass = 'col-sm-6';
							}
						} else if (columnCount === 3) {
							if (column.span === 2) {
								spanClass = 'col-sm-8';
							} else if (column.span === 3) {
								spanClass = 'col-sm-12';
							} else {
								spanClass = 'col-sm-4';
							}
						} else if (columnCount === 4) {
							if (column.span === 2) {
								spanClass = 'col-sm-6';
							} else if (column.span === 3) {
								spanClass = 'col-sm-9';
							} else if (column.span === 4) {
								spanClass = 'col-sm-12';
							} else {
								spanClass = 'col-md-3 col-sm-6';
							}
						} else {
							spanClass = 'col-sm-12';
						}
						%>
						<div class="column <%= spanClass %>">
							<% _.each(column, function (cell, cellNumber) { %>
							<div class="cell form-group<% if (cell.field) { %> {{#if hiddenFields.<%= cell.field %>}}hidden-cell{{/if}}<% } %>"
								 data-name="<%= cell.field %>">
								<% if (!cell.noLabel) { %>
								<label class="control-label<% if (cell.field) { %> {{#if hiddenFields.<%= cell.field %>}}hidden{{/if}}<% } %>"
									   data-name="<%= cell.field %>">
									<span class="label-text">
										<%
										if ('customLabel' in cell) {
											print(cell.customLabel);
										} else {
											print("{{translate \"" + cell.field + "\" scope=\"" + model.name + "\" category='fields'}}");
										}
										%>
									</span>
								</label>
								<% } %>
								<div class="field<% if (cell.field) { %> {{#if hiddenFields.<%= cell.field %>}}hidden{{/if}}<% } %>"
									 data-name="<%= cell.field %>">
									<%
									if ('customCode' in cell) {
										print(cell.customCode);
									} else {
										print("{{{this." + cell.name + "}}}");
									}
									%>
								</div>
							</div>
							<% }); %>
						</div>
						<% }); %>
						<% if (columnCount) { %>
							</div>
						<% } %>
					</div>
				</div>
			</div>
		<% }); %>
	</div>
</div>