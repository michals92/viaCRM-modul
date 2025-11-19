<div class="dynamic-logic-options">
    <div class="dynamic-logic-options-list-container list-group">
        {{#if itemDataList.length}}
            {{#each itemDataList}}
            <div class="list-group-item" data-id="{{index}}">
                {{#if ../isEditMode}}
                <div class="clearfix option-list-item-header">
                    <div class="pull-right">
                        <a
                            role="button"
                            tabindex="0"
                            data-action="removeRule"
                            data-index="{{index}}"
                            class="remove-option-list"
                            title="{{translate 'Remove'}}"
                        >
                            <span class="fas fa-minus fa-sm"></span>
                        </a>
                    </div>
                </div>
                {{/if}}
                <div class="nested-view-container" data-key="{{key}}">
                    {{{var key ../this}}}
                </div>
                <div>
                    {{#if ../isEditMode}}
                    <div class="pull-right">
                        <a
                            role="button"
                            tabindex="0"
                            data-action="editConditions"
                            data-index="{{index}}"
                        >{{translate 'Edit'}}</a>
                    </div>
                    {{/if}}
                    <div class="string-container" data-key="{{conditionGroupViewKey}}">
                        {{{var conditionGroupViewKey ../this}}}
                    </div>
                </div>
            </div>
            {{/each}}
        {{else}}
            <div class="empty-message well">
                <p class="text-muted">{{translate 'No Rules' scope='Admin'}}</p>
                {{#if isEditMode}}
                <button class="btn btn-primary" data-action="addRule">
                    <span class="fas fa-plus"></span> {{translate 'Add Rule' scope='Admin'}}
                </button>
                {{/if}}
            </div>
        {{/if}}
    </div>
    <div>
        {{#if itemDataList.length}}
            {{#if isEditMode}}
            <a
                role="button"
                tabindex="0"
                data-action="addRule"
                title="{{translate 'Add'}}"
                class="add-option-list"
            ><span class="fas fa-plus fa-sm"></span></a>
            {{/if}}
        {{/if}}
    </div>
</div>
