<header data-name="{{name}}">
	<label
		data-is-custom="{{#if isCustomLabel}}true{{/if}}"
		data-label="{{label}}"
	>{{labelTranslated}}</label>&nbsp;
	<a
		role="button"
		tabindex="0"
		data-action="edit-panel-label"
		class="edit-panel-label"
	><i class="fas fa-pencil-alt fa-sm"></i></a>
	<a
		role="button"
		tabindex="0"
		style="float: right;"
		data-action="removePanel"
		class="remove-panel"
		data-number="{{number}}"
	><i class="fas fa-times"></i></a>
</header>
<ul class="rows">
	{{#each rows}}
		<li
			data-cell-count="{{./this.length}}"
			{{#each (lookup (lookup ../this 'rowData') @index) }}
				data-{{toDom @key}}="{{this}}"
			{{/each}}
		>
			<a
				role="button"
				tabindex="0"
				data-action="edit-row-label"
				class="edit-row-label"
			>
				<i class="fas fa-pencil-alt fa-sm"></i>
			</a>
			<div class="row-actions clear-fix">
				<a
					role="button"
					tabindex="0"
					data-action="removeRow"
					class="remove-row"
				><i class="fas fa-times"></i></a>
				<a
					role="button"
					tabindex="0"
					data-action="plusCell"
					class="add-cell"
				><i class="fas fa-plus"></i></a>
			</div>
			<ul class="cells" data-cell-count="{{./this.length}}">
				{{#each this}}
					{{#if this}}
						<li
							class="cell"
							{{#each dataAttributes}}
							data-{{toDom this}}="{{var this ../this}}"
							{{/each}}>
							<div class="left" style="width: calc(100% - 30px);">{{label}}</div>
							<div class="right" style="width: 30px;">
								<a href="javascript:" data-action="editField" class="edit-field"><i
									class="fas fa-pencil-alt fa-sm"></i></a>
								<a href="javascript:" data-action="removeField" class="remove-field"><i
									class="fas fa-times"></i></a>
							</div>
						</li>
					{{else}}
						<li class="empty cell">
							<div class="right" style="width: 14px;">
								<a
									role="button"
									tabindex="0"
									data-action="minusCell"
									class="remove-field"
								><i class="fas fa-minus"></i></a>
							</div>
						</li>
					{{/if}}
				{{/each}}
			</ul>
		</li>
	{{/each}}
</ul>
<div>
	<a
		role="button"
		tabindex="0"
		data-action="addRow"
	><i class="fas fa-plus"></i></a>
</div>
