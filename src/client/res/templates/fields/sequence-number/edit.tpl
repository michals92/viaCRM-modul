<div class="input-group input-group-currency">
    <span class="input-group-item">
        <input
            type="text"
            class="main-element form-control radius-left numeric-text"
			{{#if isCustomValue}}
			{{else}}
			placeholder="{{translate 'sequenceNumber' category='placeholders' scope='Global'}}"
			{{/if}}
            data-name="{{name}}"
            value="{{value}}"
            autocomplete="espo-{{name}}"
            pattern="[\-]?[0-9,.]*"
            {{#if params.maxLength}} maxlength="{{params.maxLength}}"{{/if}}
        >
    </span>
    {{#if params.allowCustomValue}}
    <span class="input-group-addon radius-right">
		<input
			type="checkbox"
			data-name="{{name}}IsCustomValue"
			{{#if isCustomValue}}
			checked
			{{/if}}
		>
	</span>
    {{/if}}
</div>
