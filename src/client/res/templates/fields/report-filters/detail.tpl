{{#if isNotEmpty}}
<div class="report-filters-display">
    {{#each filters}}
    <div class="filter-item" style="margin-bottom: 5px; padding: 5px; background-color: #f8f9fa; border-radius: 3px;">
        <strong>{{field}}</strong> {{type}} <em>{{value}}</em>
    </div>
    {{/each}}
</div>
{{else}}
<span class="none-value">{{translate 'No filters set'}}</span>
{{/if}}