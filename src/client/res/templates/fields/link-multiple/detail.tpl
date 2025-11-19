{{#if recordListEnabled}}
    {{#if enableShowDisplayList}}
        <button class="btn btn-default" data-action="viewRelatedList">
            <span class="fas fa-list"></span> {{translate 'View List'}}
        </button>
    {{/if}}
    <div class="recordList overflow" style="overflow:auto;width:100%;scrollbar-color:auto;scrollbar-width:auto">{{{list}}}</div>
{{else if columnListEnabled}}

	{{#if value}}
	<div class="link-multiple-column-table">
		<div class="table-header">
			{{#each columnHeaders}}
				<div class="header-cell control-label" data-name="{{this.value}}">{{this.translated}}</div>
			{{/each}}
		</div>
		<div class="link-container list-group">
			{{#each itemDataList}}
			<div class="table-row">
				{{#each columnData}}
					<div class="cell">
						<div class="field field-{{@index}}" data-name="{{@key}}" data-id="{{../id}}"></div>
					</div>
				{{/each}}
			</div>
			{{/each}}
		</div>
	</div>
	{{else}}
		{{#if valueIsSet}}
			<span class="none-value">{{translate 'None'}}</span>
		{{else}}
			<span class="loading-value"></span>
		{{/if}}
	{{/if}}


{{else}}
    {{#if value}}
        {{{value}}}
    {{else}}
        {{#if valueIsSet}}
            <span class="none-value">{{translate 'None'}}</span>
        {{else}}
            <span class="loading-value">...</span>
        {{/if}}
    {{/if}}
{{/if}}
