{{#if recordListEnabled}}
	{{#ifEqual recordListButtonsPosition 'Top'}}
		{{#unless recordListCreateDisabled}}
			<button class="btn btn-default btn-icon" data-action="addItem" title="{{translate 'Add Item'}}">
				<span class="{{#if plusIconClass}}{{plusIconClass}}{{else}}fas fa-plus{{/if}}"></span>
			</button>
		{{/unless}}
		{{#unless recordListLinkDisabled}}
			<button class="btn btn-default btn-icon" data-action="linkItems" title="{{translate 'Link Items'}}">
				<span class="{{#if linkIconClass}}{{linkIconClass}}{{else}}fas fa-link{{/if}}"></span>
			</button>
		{{/unless}}
	{{/ifEqual}}

	<div class="recordList overflow{{#if params.recordListMinWidth}} record-list-min-width{{/if}}" style="overflow:auto;width:100%;scrollbar-color:auto;scrollbar-width:auto">{{{list}}}</div>

	{{#ifEqual recordListButtonsPosition 'Bottom'}}
		{{#unless recordListCreateDisabled}}
			<button class="btn btn-default btn-icon" data-action="addItem" title="{{translate 'Add Item'}}">
				<span class="{{#if plusIconClass}}{{plusIconClass}}{{else}}fas fa-plus{{/if}}"></span>
			</button>
		{{/unless}}
		{{#unless recordListLinkDisabled}}
			<button class="btn btn-default btn-icon" data-action="linkItems" title="{{translate 'Link Items'}}">
				<span class="{{#if linkIconClass}}{{linkIconClass}}{{else}}fas fa-link{{/if}}"></span>
			</button>
		{{/unless}}
	{{/ifEqual}}
{{else if columnListEnabled}}

	{{#if hasLinks}}
		<div class="recordList main-element">
			<div class="table-header">
				{{#each columnHeaders}}
					<div class="header-cell" data-name="{{this.value}}">{{this.translated}}</div>
				{{/each}}
				<div class="header-cell action-cell"></div>
			</div>
			<div class="link-container list-group">
				{{!-- Empty container that will be filled by addLinkHtml --}}
			</div>
		</div>
	{{/if}}
	<div class="input-group add-team">
		<input
			class="main-element form-control"
			type="text"
			value=""
			autocomplete="espo-{{name}}"
			placeholder="{{translate 'Select'}}"
			spellcheck="false"
		>
		<span class="input-group-btn">
			{{#if createButton}}
			<button data-action="createLink" class="btn btn-default btn-icon" type="button" title="{{translate 'Create'}}">
				<i class="fas fa-plus"></i>
			</button>
			{{/if}}
			<button
				data-action="selectLink"
				data-scope="root-link-select"
				class="btn btn-default btn-icon"
				type="button"
				title="{{translate 'Select'}}"
			>
				<span class="fas fa-angle-up"></span>
			</button>
		</span>
	</div>

{{else}}
	<div class="link-container list-group"></div>

	<div class="input-group add-team">
		<input
			class="main-element form-control"
			type="text"
			value=""
			autocomplete="espo-{{name}}"
			placeholder="{{translate 'Select'}}"
			spellcheck="false"
		>
		<span class="input-group-btn">
        <button
			data-action="selectLink"
			class="btn btn-default btn-icon"
			type="button"
			tabindex="-1"
			title="{{translate 'Select'}}"
		><span class="fas fa-angle-up"></span></button>
    </span>
	</div>

{{/if}}
