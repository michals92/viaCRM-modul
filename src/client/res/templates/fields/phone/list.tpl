{{#if phoneNumberData}}
    {{#each phoneNumberData}}
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
                    href="tel:{{phoneNumber}}"
                    data-phone-number="{{phoneNumber}}"
                    data-action="dial"
                    class="selectable"
                >
        {{/unless}}
        {{/unless}}

        <span {{#if lineThrough}}style="text-decoration: line-through"{{/if}}>{{phoneNumber}}</span>

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
            href="tel:{{valueForLink}}"
            data-phone-number="{{valueForLink}}"
            data-action="dial"
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
