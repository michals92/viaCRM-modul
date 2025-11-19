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
    {{#unless params.hideCurrencyInEdit}}
    <span class="input-group-item">
        <select
            data-name="{{currencyFieldName}}"
            class="form-control radius-right"
            disabled
        ><option value="{{currencyValue}}" selected>{{currencyValue}}</option></select>
    </span>
    {{/unless}}
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
        {{#unless params.hideCurrencyInEdit}}
        <span class="input-group-item">
            <select
                data-name="{{currencyFieldName}}"
                class="form-control radius-right"
                disabled
            ><option value="{{currencyValue}}" selected>{{currencyValue}}</option></select>
        </span>
        {{/unless}}
    </div>
{{/if}}