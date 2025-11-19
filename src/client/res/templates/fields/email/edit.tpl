<div class="email-address-block-container">
    {{#if params.compact}}
        {{#each emailAddressData}}
            <div class="email-address-block well well-sm">
                <div class="input-group">
                    <input
                        type="email"
                        class="form-control email-address{{#if optOut}} text-strikethrough{{/if}}{{#if invalid}} text-danger{{/if}}{{#if ../params.hideOptOutButton}}{{#if ../params.hideInvalidButton}} email-no-right-radius{{/if}}{{/if}}"
                        value="{{emailAddress}}"
                        autocomplete="espo-{{../name}}"
                        maxlength={{../itemMaxLength}}
                    >
                </div>
                <div class="input-group">
                    <span class="input-group-btn">
                        <button
                            class="btn btn-default btn-icon email-property{{#if primary}} active{{/if}} hidden"
                            type="button"
                            data-action="switchEmailProperty"
                            data-property-type="primary"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="{{translate 'Primary' scope='EmailAddress'}}"
                        >
                            <span class="fas fa-star fa-sm{{#unless primary}} text-muted{{/unless}}"></span>
                        </button>
                        {{#unless ../params.hideOptOutButton}}
                            <button
                                class="btn btn-default btn-icon email-property{{#if optOut}} active{{/if}}"
                                type="button"
                                data-action="switchEmailProperty"
                                data-property-type="optOut"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="{{translate 'Opted Out' scope='EmailAddress'}}"
                            >
                                <span class="fa fa-ban{{#unless optOut}} text-muted{{/unless}}"></span>
                            </button>
                        {{/unless}}
                        {{#unless ../params.hideInvalidButton}}
                            <button
                                class="btn btn-default btn-icon radius-right email-property{{#if invalid}} active{{/if}}"
                                type="button"
                                data-action="switchEmailProperty"
                                data-property-type="invalid"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="{{translate 'Invalid' scope='EmailAddress'}}"
                            >
                                <span class="fa fa-exclamation-circle{{#unless invalid}} text-muted{{/unless}}"></span>
                            </button>
                        {{/unless}}
                        <button
                            class="btn btn-link btn-icon hidden"
                            type="button"
                            tabindex="-1"
                            data-action="removeEmailAddress"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="{{translate 'Remove'}}"
                        >
                            <span class="fas fa-times"></span>
                        </button>
                    </span>
                </div>
                {{#if ../accountLinkEnabled}}
                    <div class="margin-top-1">
                        <label class="control-label">{{translate 'Associated Account' scope='Global'}}:</label>
                        <div class="input-group">
                            {{#if accountId}}
                                <input
                                    type="text"
                                    class="form-control"
                                    data-property-type="accountName"
                                    value="{{accountName}}"
                                    disabled
                                >
                                <span class="input-group-btn">
                                    <button
                                        type="button"
                                        class="btn btn-default"
                                        data-action="clearAccount"
                                        data-index="{{@index}}"
                                        title="{{translate 'Clear'}}">
                                        <span class="fas fa-unlink"></span>
                                    </button>
                                </span>
                            {{else}}
                                <input
                                    type="text"
                                    class="form-control"
                                    placeholder="{{translate 'No Account' scope='Global'}}"
                                    readonly
                                >
                                <span class="input-group-btn">
                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        data-action="selectAccount"
                                        data-index="{{@index}}">
                                        <span class="fas fa-link"></span>
                                        <span class="hidden-xs">{{translate 'Link Account' scope='Global'}}</span>
                                    </button>
                                </span>
                            {{/if}}
                        </div>
                    </div>
                {{/if}}
            </div>
        {{/each}}
    {{else}}
        {{#each emailAddressData}}
            <div class="email-address-block well well-sm">
                <div class="input-group">
                    <input
                        type="email"
                        class="form-control email-address{{#if optOut}} text-strikethrough{{/if}}{{#if invalid}} text-danger{{/if}}{{#if ../params.hideOptOutButton}}{{#if ../params.hideInvalidButton}} email-no-right-radius{{/if}}{{/if}}"
                        value="{{emailAddress}}"
                        autocomplete="espo-{{../name}}"
                        maxlength={{../itemMaxLength}}
                    >
                    <span class="input-group-btn">
                        <button
                            class="btn btn-default btn-icon email-property{{#if primary}} active{{/if}} hidden"
                            type="button"
                            data-action="switchEmailProperty"
                            data-property-type="primary"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="{{translate 'Primary' scope='EmailAddress'}}"
                        >
                            <span class="fas fa-star fa-sm{{#unless primary}} text-muted{{/unless}}"></span>
                        </button>
                        {{#unless ../params.hideOptOutButton}}
                            <button
                                class="btn btn-default btn-icon email-property{{#if optOut}} active{{/if}}"
                                type="button"
                                data-action="switchEmailProperty"
                                data-property-type="optOut"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="{{translate 'Opted Out' scope='EmailAddress'}}"
                            >
                                <span class="fa fa-ban{{#unless optOut}} text-muted{{/unless}}"></span>
                            </button>
                        {{/unless}}
                        {{#unless ../params.hideInvalidButton}}
                            <button
                                class="btn btn-default btn-icon radius-right email-property{{#if invalid}} active{{/if}}"
                                type="button"
                                data-action="switchEmailProperty"
                                data-property-type="invalid"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="{{translate 'Invalid' scope='EmailAddress'}}"
                            >
                                <span class="fa fa-exclamation-circle{{#unless invalid}} text-muted{{/unless}}"></span>
                            </button>
                        {{/unless}}
                        <button
                            class="btn btn-link btn-icon hidden"
                            type="button"
                            tabindex="-1"
                            data-action="removeEmailAddress"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="{{translate 'Remove'}}"
                        >
                            <span class="fas fa-times"></span>
                        </button>
                    </span>
                </div>
                {{#if ../accountLinkEnabled}}
                <div class="margin-top-1">
                    <label class="control-label">{{translate 'Associated Account' scope='Global'}}:</label>
                    <div class="input-group">
                        {{#if accountId}}
                            <input
                                type="text"
                                class="form-control"
                                data-property-type="accountName"
                                value="{{accountName}}"
                                disabled
                            >
                            <span class="input-group-btn">
                                <button
                                    type="button"
                                    class="btn btn-default"
                                    data-action="clearAccount"
                                    data-index="{{@index}}"
                                    title="{{translate 'Clear'}}">
                                    <span class="fas fa-unlink"></span>
                                </button>
                            </span>
                        {{else}}
                            <input
                                type="text"
                                class="form-control"
                                placeholder="{{translate 'No Account' scope='Global'}}"
                                readonly
                            >
                            <span class="input-group-btn">
                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    data-action="selectAccount"
                                    data-index="{{@index}}">
                                    <span class="fas fa-link"></span>
                                    <span class="hidden-xs">{{translate 'Link Account' scope='Global'}}</span>
                                </button>
                            </span>
                        {{/if}}
                    </div>
                </div>
                {{/if}}
            </div>
        {{/each}}
    {{/if}}
</div>

{{#unless params.hideAddButton}}
    <button class="btn btn-default btn-icon" type="button" data-action="addEmailAddress"><span class="fa fa-plus"></span></button>
{{/unless}}
