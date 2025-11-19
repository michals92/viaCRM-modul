{{#if isNotEmpty}}
    {{#if style}}
        <span class="{{class}}-{{style}}" title="{{valueTranslated}}">
    {{/if}}
    
    {{#if iconClass}}
        <span class="{{iconClass}} fa-sm enum-icon"></span>
    {{/if}}
    
    {{valueTranslated}}
    
    {{#if style}}
        </span>
    {{/if}}
{{/if}}
