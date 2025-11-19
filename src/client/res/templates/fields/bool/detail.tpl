{{#if valueIsSet}}
    {{#ifEqual params.display 'Switch'}}
        <input
            class="form-checkbox bool-display-switch"
            type="checkbox"
            {{#if value}} checked{{/if}}
            {{#unless forcedEdit}} disabled{{/unless}}
        >
    {{else}}
        <input
            class="form-checkbox"
            type="checkbox"
            {{#if value}} checked{{/if}}
            {{#unless forcedEdit}} disabled{{/unless}}
        >
    {{/ifEqual}}
{{else}}
    <span class="loading-value"></span>
{{/if}}
