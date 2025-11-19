{{#*inline "displayNoValue"}}
    {{#if valueIsSet}}
        <span class="none-value">{{translate 'None'}}</span>
    {{else}}
        <span class="loading-value">...</span>
    {{/if}}
{{/inline}}

{{#if recordListSuperCompact}}
    {{#if size}}
        <a class="super-compact-size" data-action="showRecordListPopup">{{size}}</a>
    {{else}}
        {{> displayNoValue}}
    {{/if}}
{{else}}
    {{#if recordListEnabled}}
        {{#if enableShowDisplayList}}
            <button class="btn btn-default" data-action="viewRelatedList">
                <span class="fas fa-list"></span> {{translate 'View List'}}
            </button>
        {{/if}}
        <div class="recordList overflow{{#if params.recordListMinWidth}} record-list-min-width{{/if}}" style="overflow:auto;width:100%;scrollbar-color:auto;scrollbar-width:auto">{{{list}}}</div>
    {{else}}
        {{#if value}}
            {{{value}}}
        {{else}}
            {{> displayNoValue}}
        {{/if}}
    {{/if}}
{{/if}}
