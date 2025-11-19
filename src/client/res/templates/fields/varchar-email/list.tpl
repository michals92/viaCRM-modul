<a
    role="button"
    tabindex="0"
    data-email-address="{{value}}"
    data-action="mailTo"
    title="{{value}}"
    class="selectable text-default"
    {{#if isOptedOut}}style="text-decoration: line-through;"{{/if}}
>{{value}}</a>