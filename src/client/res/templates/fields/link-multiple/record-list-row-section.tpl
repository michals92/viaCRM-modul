<div class="section-wrapper{{#if isCollapsed}} collapsed{{/if}}" data-id="{{model.id}}" data-collapse-mode="{{currentMode}}">
    <div class="section-header">
        {{#if collapsible}}
            <button type="button" class="collapse-toggle" data-action="toggleCollapse" title="{{translate 'Toggle' category='labels'}}">
                {{#ifEqual currentMode 'expanded'}}
                    <i class="fas fa-chevron-down"></i>
                {{/ifEqual}}
                {{#ifEqual currentMode 'threshold'}}
                    <i class="fas fa-chevron-right"></i>
                {{/ifEqual}}
                {{#ifEqual currentMode 'collapsed'}}
                    <i class="fas fa-chevron-right"></i>
                {{/ifEqual}}
            </button>
        {{/if}}
        {{#ifEqual mode 'edit'}}
            {{#if checkboxes}}
                <div class="checkbox-cell">
                    <input type="checkbox" class="record-checkbox form-checkbox form-checkbox-small" data-id="{{model.id}}">
                </div>
            {{/if}}
        {{/ifEqual}}
        <h5 class="section-title">
            <a href="#{{scope}}/view/{{model.id}}" class="link" data-id="{{model.id}}">
                {{#if model.attributes.name}}
                    {{model.attributes.name}}
                {{else}}
                    {{translate scope category='scopeNames'}}
                {{/if}}
            </a>
        </h5>
        {{#if collapsible}}
            <div class="section-summary">
                {{#if isCollapsed}}
                    {{#ifEqual collapseMode 'collapsed'}}
                        <span class="field-count">{{fieldCount}} {{translate 'fields' category='labels'}}</span>
                    {{/ifEqual}}
                    {{#ifEqual collapseMode 'threshold'}}
                        <span class="field-count">+{{hiddenFieldCount}} {{translate 'more' category='labels'}}</span>
                    {{/ifEqual}}
                {{/if}}
            </div>
        {{/if}}
        {{#if hasActions}}
            <div class="section-actions">
                <div class="list-row-buttons btn-group pull-right">
                    {{#if showSort}}
                        {{{var 'sortButton' this}}}
                    {{/if}}
                    {{#if showDuplicate}}
                        {{{var 'duplicateButton' this}}}
                    {{/if}}
                    {{#if showUnlink}}
                        {{{var 'unlinkButton' this}}}
                    {{/if}}
                    {{#if showRemove}}
                        {{{var 'removeButton' this}}}
                    {{/if}}
                </div>
            </div>
        {{/if}}
    </div>
    <div class="section-content">
        <div class="section-fields">
            {{#each visibleFieldList}}
                <div class="field-row" data-name="{{name}}">
                    <div class="field-label">
                        {{label}}{{#if required}} *{{/if}}:
                    </div>
                    <div class="field-value">
                        <div data-name="{{name}}"></div>
                    </div>
                </div>
            {{/each}}
        </div>
    </div>
</div>