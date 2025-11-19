<ul class="dropdown-menu dropdown-menu-right teams-panel show" role="menu" aria-labelledby="nav-team-switching">
    {{#if defaultTeam}}
        <li role="presentation" class="dropdown-header px-3">{{translate "Current Default Team" scope="Global" category="teams"}}</li>
        <li role="presentation">
            <a class="dropdown-item pe-none default-team" role="link" aria-disabled="true">
                <strong>{{defaultTeam.name}}</strong>
            </a>
        </li>
    {{/if}}

    {{#if teams}}
         <li role="presentation" class="divider"></li>
         <li role="presentation" class="dropdown-header px-3">{{translate "Available Teams" scope="Global" category="teams"}}</li>
        {{#each teams}}
            <li role="presentation">
                <a class="dropdown-item" role="button" data-id="{{@key}}" title="{{translate 'Set as Default Team' scope='Global' category='teams'}}" tabindex="0">
                    {{this}}
                </a>
            </li>
        {{/each}}
    {{else}}
        {{#unless defaultTeam}}
            <li role="presentation" class="dropdown-header px-3">{{translate "Available Teams" scope="Global" category="teams"}}</li>
        {{else}}
            <li role="presentation" class="divider"></li>
        {{/unless}}
        <li role="presentation">
            <a class="dropdown-item pe-none text-muted fst-italic" role="link" aria-disabled="true">
                {{translate "No Available Teams" scope="Global" category="teams"}}
            </a>
        </li>
    {{/if}}
</ul>
