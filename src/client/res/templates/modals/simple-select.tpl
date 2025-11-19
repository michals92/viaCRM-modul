<div class="margin-bottom-2x margin-top">
    <input
        type="text"
        maxlength="64"
        placeholder="{{translate 'Search'}}"
        data-name="quick-search"
        class="form-control"
        spellcheck="false"
    >
</div>

<ul class="list-group no-side-margin">
{{#each itemList}}
    <li class="list-group-item" data-name="{{value}}">
        <a role="button" tabindex="0" data-action="select" data-value="{{value}}" class="text-bold">
            {{label}}
        </a>
    </li>
{{/each}}
</ul>

<div class="no-data hidden">{{translate 'No Data'}}</div>