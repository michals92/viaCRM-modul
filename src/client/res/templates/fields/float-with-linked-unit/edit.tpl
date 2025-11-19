{{#if params.compact}}
    <span class="input-group-item">
        <input
            type="text"
            class="main-element form-control radius-left compact"
            data-name="{{name}}"
            value="{{value}}"
            autocomplete="espo-{{name}}"
            pattern="[\-]?[0-9,.]*"
            {{#if params.maxLength}} maxlength="{{params.maxLength}}"{{/if}}
        >
    </span>
    {{#if unitValue}}
    <span class="input-group-item">
        <span class="form-control radius-right unit-value text-muted" style="background-color: #f5f5f5; cursor: default;">{{unitValue}}</span>
    </span>
    {{/if}}
{{else}}
    <div class="input-group input-group-currency">
        <span class="input-group-item">
            <input
                type="text"
                class="main-element form-control radius-left"
                data-name="{{name}}"
                value="{{value}}"
                autocomplete="espo-{{name}}"
                pattern="[\-]?[0-9,.]*"
                {{#if params.maxLength}} maxlength="{{params.maxLength}}"{{/if}}
            >
        </span>
        {{#if unitValue}}
        <span class="input-group-item">
            <span class="form-control radius-right unit-value text-muted" style="background-color: #f5f5f5; cursor: default;">{{unitValue}}</span>
        </span>
        {{/if}}
    </div>
{{/if}}
