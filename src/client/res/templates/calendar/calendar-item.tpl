<div class="panel panel-default">
    <div class="panel-body calendar-item" style="background-color: {{eventColor}}; overflow: hidden; max-height: 100%; display: -webkit-box; -webkit-box-orient: vertical;">
        {{#each layoutDataList}}
            <div style="width: 100%;">
                {{#if isFirst}}
                    {{#unless rowActionsDisabled}}
                        <div class="pull-right item-menu-container">{{{../itemMenu}}}</div>
                    {{/unless}}
                {{/if}}
                <div class="form-group" style="margin-bottom: 2px;">
                    <div
                        class="field{{#if isAlignRight}} field-right-align{{/if}}{{#if isLarge}} field-large{{/if}}{{#if isMuted}} text-muted{{/if}}"
                        data-name="{{name}}"
                        style="word-wrap: break-word; word-break: break-word; -webkit-line-clamp: 3; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical;"
                    >{{{var key ../this}}}</div>
                </div>
            </div>
        {{/each}}
    </div>
</div>
