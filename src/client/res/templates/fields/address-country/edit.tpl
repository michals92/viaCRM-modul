{{#if isEnum}}
	<select data-name='{{name}}' class='form-control main-element'>
		{{options
			options
			value
			scope=scope
			field=name
			translatedOptions=translatedOptions
			includeMissingOption=true
			styleMap=styleMap
		}}
	</select>
{{else}}
	<input
		type="text"
		class="main-element form-control"
		data-name="{{name}}"
		value="{{value}}"
		{{#if params.maxLength}} maxlength="{{params.maxLength}}"{{/if}}
		autocomplete="espo-{{name}}"
		{{#if noSpellCheck}}
		spellcheck="false"
		{{/if}}
	>
{{/if}}
