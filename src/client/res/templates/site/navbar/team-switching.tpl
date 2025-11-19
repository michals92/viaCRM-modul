
<a
    id='nav-team-switching'
    class="dropdown-toggle"
    role='button'
    aria-expanded="false"
    data-action="showTeamSwitcher"
    tabindex='0'
    title='{{translate "Teams" scope="Global"}}'
    style='width: unset'
>
    <span class='fas fa-users icon'></span>
    {{#if defaultTeam}}
        <span class="current-team ms-1">{{defaultTeam.name}}</span>
    {{/if}}
    <span class="caret"></span>
</a>
<div class="dropdown user-teams-container">
</div>