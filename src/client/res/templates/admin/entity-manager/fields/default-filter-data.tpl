<div class="input-group">
    <div class="input-group-btn left-dropdown">
        <button
            type="button"
            class="btn btn-default dropdown-toggle filters-button"
            title="{{translate 'Filter'}}"
            data-toggle="dropdown"
            tabindex="0"
        >
            <span class="filters-label"></span>
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu pull-left filter-menu">
            <li>
                <a
                    class="preset"
                    tabindex="0"
                    role="button"
                    data-name=""
                    data-action="selectPreset"
                ><div>{{translate 'all' category='presetFilters' scope=entityType}}</div></a>
            </li>
            {{#each presetFilterList}}
            <li>
                <a
                    class="preset"
                    tabindex="0"
                    role="button"
                    data-name="{{name}}"
                    data-action="selectPreset"
                >
                    <div class="{{#if style}}text-{{style}}{{/if}}">
                    {{#if label}}{{label}}{{else}}{{translate name category='presetFilters' scope=../entityType}}{{/if}}
                    </div>
                </a>
            </li>
            {{/each}}
            <li class="divider preset-control hidden"></li>
            
            {{#if boolFilterList.length}}
                <li class="divider"></li>
            {{/if}}

            {{#each boolFilterList}}
                <li class="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            data-role="boolFilterCheckbox"
                            data-name="{{./this}}"
                            class="form-checkbox form-checkbox-small"
                            {{#ifPropEquals ../bool this true}}checked{{/ifPropEquals}}
                        > {{translate this scope=../entityType category='boolFilters'}}
                    </label></li>
            {{/each}}
        </ul>
    </div>
</div>