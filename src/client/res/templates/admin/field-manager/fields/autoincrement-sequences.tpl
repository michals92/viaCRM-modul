
<div class="dynamic-logic-options">
    <div class="dynamic-logic-options-list-container list-group">
        {{#each itemDataList}}
        <div class='list-group-item data-id="{{index}}"'>
            <div class="clearfix option-list-item-header">
                <div class="pull-right">
                    <a
                        role="button"
                        tabindex="0"
                        data-action="removeSequence"
                        data-index="{{index}}"
                        class="remove-option-list"
                        title="{{translate 'Remove'}}"
                    >
                        <span class="fas fa-minus fa-sm"></span>
                    </a>
                </div>
            </div>
            <div class="nested-view-container" data-key="{{key}}">
                {{{var key ../this}}}
            </div>
            <div>
                <div class="pull-right">
                    <a
                        role="button"
                        tabindex="0"
                        data-action="editConditions"
                        data-index="{{index}}"
                    >{{translate 'Edit'}}</a>
                </div>
                <div class="string-container" data-key="{{conditionGroupViewKey}}">
                    {{{var conditionGroupViewKey ../this}}}
                </div>
            </div>
        </div>
        {{/each}}
    </div>
    <div>
        <a
            role="button"
            tabindex="0"
            data-action="addSequence"
            title="{{translate 'Add'}}"
            class="add-option-list"
        ><span class="fas fa-plus fa-sm"></span></a>
    </div>
</div>
