<div class="search-filters-field">
    {{#if hasFilters}}
        <i class="fas fa-filter text-primary"></i> {{filterDisplay}}
    {{else}}
        <span class="text-muted">{{translate 'No filters'}}</span>
    {{/if}}
</div>