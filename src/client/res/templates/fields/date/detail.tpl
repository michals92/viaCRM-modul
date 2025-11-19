{{#if dateValue ~}}
    {{#if style}}
        {{#if iconClass}}
            <span class="fas {{iconClass}} text-{{style}}"></span>
        {{/if}}
    {{/if}}
    
    <span {{#if style}}class="text-{{style}}" {{/if}}>{{dateValue}}</span>

    {{#if copyToClipboard}}
        <a role="button" data-action="copyToClipboard" class="pull-right text-soft" title="{{translate 'Copy to Clipboard'}}">
            <span class="far fa-copy"></span>
        </a>
    {{/if}}
{{~/if}}

{{#if isNone}}
    <span class="none-value">{{translate 'None'}}</span>
{{/if}}

{{#if isLoading}}
    <span class="loading-value"></span>
{{/if}}