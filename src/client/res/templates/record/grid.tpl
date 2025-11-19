{{#if collection.models.length}}

{{#if topBar}}
<div class="list-buttons-container clearfix">
    {{#if paginationTop}}
    <div>
        {{{pagination}}}
    </div>
    {{/if}}

    {{#if displayActionsButtonGroup}}
    <div class="btn-group actions">
        {{#if massActionList}}
        <button
            type="button"
            class="btn btn-default btn-xs-wide dropdown-toggle actions-button hidden"
            data-toggle="dropdown"
        >{{translate 'Actions'}} <span class="caret"></span></button>
        {{/if}}
        {{#if buttonList.length}}
        {{#each buttonList}}
            {{button
                name
                scope=../scope
                label=label
                style=style
                hidden=hidden
                class='list-action-item'
            }}
        {{/each}}
        {{/if}}

        <div class="btn-group">
            {{#if dropdownItemList.length}}
            <button
                type="button"
                class="btn btn-text dropdown-toggle dropdown-item-list-button"
                data-toggle="dropdown"
            ><span class="fas fa-ellipsis-h"></span></button>
            <ul class="dropdown-menu pull-left">
                {{#each dropdownItemList}}
                {{#if this}}
                <li class="{{#if hidden}}hidden{{/if}}">
                <a
                    role="button"
                    tabindex="0"
                    class="action list-action-item"
                    data-action="{{name}}"
                    data-name="{{name}}"
                >{{#if html}}{{{html}}}{{else}}{{translate label scope=../entityType}}{{/if}}</a></li>
                {{else}}
                    {{#unless @first}}
                    {{#unless @last}}
                    <li class="divider"></li>
                    {{/unless}}
                    {{/unless}}
                {{/if}}
                {{/each}}
            </ul>
            {{/if}}
        </div>

        {{#if massActionList}}
        <ul class="dropdown-menu actions-menu">
            {{#each massActionList}}
            {{#if this}}
            <li>
                <a
                    role="button"
                    tabindex="0"
                    data-action="{{./this}}"
                    class='mass-action'
                >{{translate this category="massActions" scope=../scope}}</a></li>
            {{else}}
            {{#unless @first}}
            {{#unless @last}}
            <li class="divider"></li>
            {{/unless}}
            {{/unless}}
            {{/if}}
            {{/each}}
        </ul>
        {{/if}}
    </div>

    <div class="sticked-bar hidden">
        <div class="btn-group">
            <button
                type="button"
                class="btn btn-default btn-xs-wide dropdown-toggle actions-button hidden"
                data-toggle="dropdown"
            >{{translate 'Actions'}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu actions-menu">
                {{#each massActionList}}
                {{#if this}}
                <li>
                    <a
                        role="button"
                        tabindex="0"
                        data-action="{{./this}}"
                        class='mass-action'
                    >{{translate this category="massActions" scope=../scope}}</a>
                </li>
                {{else}}
                {{#unless @first}}
                {{#unless @last}}
                <li class="divider"></li>
                {{/unless}}
                {{/unless}}
                {{/if}}
                {{/each}}
            </ul>
        </div>
    </div>
    {{/if}}

    {{#if displayTotalCount}}
    <div class="text-muted total-count">
        <span
            title="{{translate 'Total'}}"
            class="total-count-span"
        >{{totalCountFormatted}}</span>
    </div>
    {{/if}}
</div>
{{/if}}

<div class="grid-layout" style="display: grid; grid-template-columns: repeat({{itemsPerRow}}, 1fr); gap: 10px;">
    {{#each rowList}}
    <div class="grid-item" data-id="{{./this}}">
        {{{var this ../this}}}
    </div>
    {{/each}}
</div>

{{#if bottomBar}}
<div class="list-bottom-bar">
{{#if paginationBottom}} {{{pagination}}} {{/if}}
</div>
{{/if}}

{{else}}
    {{#unless noDataDisabled}}
    <div class="no-data">{{translate 'No Data'}}</div>
    {{/unless}}
{{/if}}
