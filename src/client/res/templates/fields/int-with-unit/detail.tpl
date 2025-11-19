{{#if isNotEmpty}}
	{{value}}
	<span class="unit-value">{{unitValue}}</span>
{{else}}
	{{#if valueIsSet}}<span class='none-value'>{{translate 'None'}}</span>{{else}}
		<span class='loading-value'>...</span>{{/if}}
{{/if}}