<div class="sic-code-control">
	<input
		type="text"
		class="main-element form-control{{#if providersEnabled}} sic-fill-input{{/if}}"
		data-name="{{name}}"
		value="{{value}}"
		{{#if params.maxLength}} maxlength="{{params.maxLength}}"{{/if}}
		autocomplete="espo-{{name}}"
		{{#if noSpellCheck}}
		spellcheck="false"
		{{/if}}
	>
	{{#if providersEnabled}}
		<div class="dropdown sic-fill-dropdown">
			<button class="btn btn-default btn-icon btn-fillData" data-toggle="dropdown"
					title="{{translate 'Fill Data' scope='Account'}}">
				<span class="fa fa-cloud-download-alt"></span>
			</button>
			<ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
				{{#each providers}}
					<li>
						<a class="dropdown-item sic-fill-provider" data-provider-id="{{this.id}}" data-action="fillFrom{{this.id}}" href="#">
							{{this.label}}
						</a>
					</li>
				{{/each}}
			</ul>
		</div>
	{{/if}}
</div>
