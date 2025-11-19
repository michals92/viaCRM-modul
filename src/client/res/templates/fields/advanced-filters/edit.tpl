<div class="input-group-btn">
	<button
		type="button"
		class="btn btn-text btn-icon-wide dropdown-toggle add-filter-button"
		data-toggle="dropdown"
		tabindex="0"
	>
		<span class="fas fa-plus"></span> {{translate 'Add Field'}}
	</button>
	<ul class="dropdown-menu filter-list">
		<li class="dropdown-header">{{translate 'Add Field'}}</li>
		{{#each filterList}}
			<li
				data-name="{{name}}"
				class="{{#if selected}}hidden{{/if}}"
			><a
				role="button"
				tabindex="0"
				class="add-filter"
				data-action="addFilter"
				data-name="{{name}}"
			>{{translate name scope=../entityType category='fields'}}</a></li>
		{{/each}}
	</ul>
</div>
<div class="advanced-filters grid-auto-fill-sm">
	{{#each filterDataList}}
		<div class="filter filter-{{name}}" data-name="{{name}}">
			{{{var key ../this}}}
		</div>
	{{/each}}
</div>
