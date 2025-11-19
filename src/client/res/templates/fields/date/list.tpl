{{#if dateValue~}}
    {{#if style}}
        {{#if iconClass}}
            <span class="fas {{iconClass}} text-{{style}}"></span>
        {{/if}}
    {{/if}}
    <span title="{{dateValue}}" {{#if style}}class="text-{{style}}"{{/if}}>{{dateValue}}</span>
{{~/if}}
