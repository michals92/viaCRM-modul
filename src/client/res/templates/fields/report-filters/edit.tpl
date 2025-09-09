<div class="report-filters-field">
    <div class="filters-container">
        {{#each filters}}
        <div class="filter-row" style="margin-bottom: 10px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
            <div class="row">
                <div class="col-md-3">
                    <select class="form-control filter-field-select" data-index="{{@index}}">
                        <option value="">Select Field</option>
                        <option value="{{field}}" selected>{{field}}</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <select class="form-control filter-type-select" data-index="{{@index}}">
                        <option value="">Select Condition</option>
                        <option value="equals">Equals</option>
                        <option value="notEquals">Not Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greaterThan">Greater Than</option>
                        <option value="lessThan">Less Than</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control filter-value-input" placeholder="Value" data-index="{{@index}}" value="{{value}}">
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-danger btn-sm remove-filter-btn">
                        <span class="fas fa-trash"></span>
                    </button>
                </div>
            </div>
        </div>
        {{/each}}
    </div>
    
    <button type="button" class="btn btn-primary btn-sm add-filter-btn" style="margin-top: 10px;">
        <span class="fas fa-plus"></span> Add Filter
    </button>
</div>