{{#ifEqual params.display 'Switch'}}
    <input type="checkbox"{{#if value}} checked{{/if}} data-name="{{name}}" class="main-element form-checkbox bool-display-switch">
{{else}}
    <input type="checkbox"{{#if value}} checked{{/if}} data-name="{{name}}" class="main-element form-checkbox">
{{/ifEqual}}