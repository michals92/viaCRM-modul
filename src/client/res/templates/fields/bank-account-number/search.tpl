<input
    type="text" 
    class="main-element form-control input-sm"
    data-name="{{name}}"
    value="{{searchParams.value}}"
    {{#if params.maxLength}}maxlength="{{params.maxLength}}"{{/if}}
    autocomplete="espo-{{name}}"
>
