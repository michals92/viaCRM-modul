<input
    type="text"
    class="main-element form-control"
    data-name="{{name}}"
    value="{{value}}"
    {{#if params.maxLength}}maxlength="{{params.maxLength}}"{{/if}}
    autocomplete="espo-{{name}}"
    placeholder="{{translate 'Example'}}: 19-2235210247/0100"
>
