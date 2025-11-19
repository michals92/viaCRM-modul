{{#if emailAddressData}}
    {{#each emailAddressData}}
    <div>
        {{#unless invalid}}
            {{#unless erased}}
                {{#if ../copyToClipboard}}
                    <a
                        role="button"
                        data-action="copyToClipboard"
                        data-index="{{@index}}"
                        class="pull-right text-soft"
                        title="{{translate 'Copy to Clipboard'}}"
                    >
                        <span class="far fa-copy"></span>
                    </a>
                {{/if}}
                <a
                    role="button"
                    tabindex="0"
                    data-email-address="{{emailAddress}}"
                    data-action="mailTo"
                    class="selectable"
                >
        {{/unless}}
        {{/unless}}

        <span {{#if lineThrough}}style="text-decoration: line-through"{{/if}}>{{emailAddress}}</span>

        {{#unless invalid}}
            {{#unless erased}}
                </a>
                {{#if ../accountLinkEnabled}}
                    {{#if accountId}}
                        <span class="text-muted small">
                            (<a href="#Account/view/{{accountId}}" class="text-muted">{{accountName}}</a>)
                        </span>
                    {{/if}}
                {{/if}}
            {{/unless}}
        {{/unless}}
    </div>
    {{/each}}
{{else}}
    {{#if value}}
        {{#if copyToClipboard}}
            <a
                role="button"
                data-action="copyToClipboard"
                class="pull-right text-soft"
                title="{{translate 'Copy to Clipboard'}}"
            >
                <span class="far fa-copy"></span>
            </a>
        {{/if}}
        <a
            role="button"
            tabindex="0"
            data-email-address="{{value}}"
            data-action="mailTo"
            class="selectable"
        >
            {{value}}
        </a>
    {{else}}
        {{#if valueIsSet}}
            <span class="none-value">{{translate 'None'}}</span>
        {{else}}
            <span class="loading-value"></span>
        {{/if}}
    {{/if}}
{{/if}}
