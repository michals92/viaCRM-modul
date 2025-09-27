<div class="search-filters-field">
    <div class="input-group">
        <div class="form-control search-filters-display" style="background: #f8f9fa; cursor: pointer;" data-action="selectFilters">
            {{#if hasFilters}}
                <i class="fas fa-filter text-primary"></i> {{filterDisplay}}
            {{else}}
                <i class="fas fa-filter text-muted"></i> <span class="text-muted">{{translate 'Click to add filters'}}</span>
            {{/if}}
        </div>
        <div class="input-group-btn">
            <button type="button" class="btn btn-default" data-action="selectFilters" title="{{translate 'Select Filters'}}">
                <i class="fas fa-search"></i>
            </button>
            {{#if hasFilters}}
            <button type="button" class="btn btn-default" data-action="clearFilters" title="{{translate 'Clear Filters'}}">
                <i class="fas fa-times"></i>
            </button>
            {{/if}}
        </div>
    </div>
</div>