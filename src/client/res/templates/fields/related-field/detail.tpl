{{#if relatedValue}}
    <div class="viacrm-related-field-detail">
        <span class="viacrm-related-field-label">🔗</span>
        <span class="viacrm-related-field-value">{{relatedValue}}</span>
        {{#if relatedConfig.displayName}}
            <small class="text-muted">({{relatedConfig.displayName}})</small>
        {{/if}}
    </div>
{{else}}
    <span class="viacrm-related-field-empty text-muted">
        No related value
    </span>
{{/if}}