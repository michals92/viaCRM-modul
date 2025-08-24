{{!-- Enhanced Layout Manager Template for VIA CRM --}}

<div class="layout-manager-content viacrm-enhanced">
    
    {{!-- VIA CRM Features Header --}}
    <div class="viacrm-layout-header">
        <h4>VIA CRM Enhanced Layout Manager</h4>
        <p class="text-muted">Extended layout manager with related fields, editable columns, and formula fields support.</p>
    </div>
    
    {{!-- Feature Status Indicators --}}
    <div class="viacrm-features-status row">
        <div class="col-sm-3">
            <div class="feature-indicator related-fields">
                <span class="feature-icon">🔗</span>
                <span class="feature-name">Related Fields</span>
                <span class="feature-status active">Ready</span>
            </div>
        </div>
        <div class="col-sm-3">
            <div class="feature-indicator editable-fields">
                <span class="feature-icon">✏️</span>
                <span class="feature-name">Editable Fields</span>
                <span class="feature-status active">Ready</span>
            </div>
        </div>
        <div class="col-sm-3">
            <div class="feature-indicator formula-fields">
                <span class="feature-icon">ƒ</span>
                <span class="feature-name">Formula Fields</span>
                <span class="feature-status active">Ready</span>
            </div>
        </div>
        <div class="col-sm-3">
            <div class="feature-indicator custom-panels">
                <span class="feature-icon">📋</span>
                <span class="feature-name">Custom Panels</span>
                <span class="feature-status active">Ready</span>
            </div>
        </div>
    </div>
    
    {{!-- Standard Layout Manager Content --}}
    <div class="layout-manager-standard">
        {{>admin/layout-manager}}
    </div>
    
    {{!-- VIA CRM Quick Actions --}}
    <div class="viacrm-quick-actions">
        <h5>Quick Actions</h5>
        <div class="btn-group">
            <button class="btn btn-default btn-sm" data-action="addRelatedField">
                🔗 Add Related Field
            </button>
            <button class="btn btn-default btn-sm" data-action="enableEditableFields">
                ✏️ Enable Editable Fields
            </button>
            <button class="btn btn-default btn-sm" data-action="addFormulaField">
                ƒ Add Formula Field
            </button>
            <button class="btn btn-default btn-sm" data-action="customizePanel">
                📋 Customize Panel
            </button>
        </div>
    </div>
    
</div>