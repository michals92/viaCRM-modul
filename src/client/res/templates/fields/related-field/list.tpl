{{#if relatedValue}}
    <span class="viacrm-related-field-value" title="Related field from {{relatedConfig.relatedEntity}}">
        🔗 {{relatedValue}}
    </span>
{{else}}
    <span class="viacrm-related-field-empty text-muted">
        —
    </span>
{{/if}}