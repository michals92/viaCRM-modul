{{#ifEqual params.display 'Switch'}}
    <input type="checkbox" class="form-checkbox form-checkbox bool-display-switch"{{#if value}} checked{{/if}} {{#unless forcedEdit}} disabled{{/unless}}>
{{else}}
    <input type="checkbox" class="form-checkbox form-checkbox"{{#if value}} checked{{/if}} {{#unless forcedEdit}} disabled{{/unless}}>
{{/ifEqual}}