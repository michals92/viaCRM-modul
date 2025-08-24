<div class="template-selection-content">
    {{#if hasTemplates}}
        <div class="row template-list">
            {{#each templates}}
            <div class="col-md-6 col-sm-12">
                <div class="panel panel-default template-item" data-action="selectTemplate" data-id="{{id}}" style="cursor: pointer; margin-bottom: 15px;">
                    <div class="panel-body">
                        <h4 style="margin-top: 0;">
                            <i class="fas fa-clipboard-list" style="margin-right: 8px; color: #3498db;"></i>
                            {{name}}
                        </h4>
                        {{#if description}}
                            <p class="text-muted" style="margin-bottom: 8px;">{{description}}</p>
                        {{/if}}
                        <div class="template-meta">
                            <small class="text-muted">
                                <i class="fas fa-user fa-sm" style="margin-right: 4px;"></i>
                                {{createdByName}}
                                {{#if createdAt}}
                                    • {{dateFormat createdAt}}
                                {{/if}}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
            {{/each}}
        </div>
        
        <div class="template-actions" style="text-align: center; margin-top: 20px;">
            <button class="btn btn-default" data-action="createTemplate">
                <i class="fas fa-plus fa-sm" style="margin-right: 6px;"></i>
                Create New Template
            </button>
        </div>
    {{else}}
        <div class="no-templates" style="text-align: center; padding: 40px 20px;">
            <i class="fas fa-clipboard-list" style="font-size: 48px; color: #bbb; margin-bottom: 20px;"></i>
            <h4 style="color: #888;">No Templates Available</h4>
            <p class="text-muted">No templates found for {{entityType}}. Create your first template to get started.</p>
            <button class="btn btn-primary" data-action="createTemplate" style="margin-top: 15px;">
                <i class="fas fa-plus fa-sm" style="margin-right: 6px;"></i>
                Create First Template
            </button>
        </div>
    {{/if}}
</div>

<style>
.template-item {
    transition: all 0.2s ease;
    border: 1px solid #ddd;
}

.template-item:hover {
    border-color: #3498db;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
    transform: translateY(-1px);
}

.template-item:active {
    transform: translateY(0);
}

.template-list {
    max-height: 400px;
    overflow-y: auto;
}
</style>