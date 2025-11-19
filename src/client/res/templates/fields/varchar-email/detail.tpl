{{#if value}}
    <a
        role="button"
        tabindex="0"
        data-email-address="{{value}}"
        data-action="mailTo"
        class="selectable"
    >{{value}}</a>
{{else}}
    {{#if valueIsSet}}
        <span class="none-value">{{translate 'None'}}</span>
    {{else}}
        <span class="loading-value"></span>
    {{/if}}
{{/if}}