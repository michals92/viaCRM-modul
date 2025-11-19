{{#if idValue}}
    <a
        href="#{{foreignScope}}/view/{{idValue}}"
        class="link"
        data-id="{{idValue}}"
        title="{{nameValue}}"
    >
        {{#if nameValue}}
            {{nameValue}}
        {{else}}
            {{translate 'None'}}
        {{/if}}
    </a>
{{else}}
    {{#if nameValue}}
        {{nameValue}}
    {{else}}
        {{translate 'None'}}
    {{/if}}
{{/if}}