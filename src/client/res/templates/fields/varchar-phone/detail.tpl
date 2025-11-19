{{#if value}}
    <a
        href="tel:{{valueForLink}}"
        data-phone-number="{{valueForLink}}"
        data-action="dial"
        class="selectable"
    >{{phoneNumber}}</a>
{{else}}
    {{#if valueIsSet}}
        <span class="none-value">{{translate 'None'}}</span>
    {{else}}
        <span class="loading-value"></span>
    {{/if}}
{{/if}}