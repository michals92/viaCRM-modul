{{#if isNotEmpty}}
    {{#if style}}
        <span class="{{class}}-{{style}}">
    {{/if}}

    {{#if iconClass}}
        <span class="{{iconClass}} fa-sm enum-icon"></span>
    {{/if}}
    
    {{valueTranslated}}
    
    {{#if style}}
        </span>
    {{/if}}
{{else}}
    {{#if valueIsSet}}
        <span class="none-value">{{translate 'None'}}</span>
    {{else}}
        <span class="loading-value"></span>
    {{/if}}
{{/if}}
