<div class='row'>
	<div class='cell col-sm-6 form-group add-field-container'>
		<button class='btn btn-default radius-right' type='button' data-action='addField'>
			{{translate 'Add Field' scope='Admin'}}
		</button>
	</div>
</div>

<div class='field-definitions'>
	{{#each fieldList}}
		<div class='margin clearfix field-row' data-field='{{this}}' style='margin-left: 20px;'>
			<a role='button' tabindex='0' class='pull-right' data-action='removeField' data-field='{{this}}'>
				<span class='fas fa-times'></span>
			</a>
			<label>{{translate this category='fields' scope=../foreignScope}}</label>
			<div class='field-container field' data-field='{{this}}'>
				{{{var (concat 'field-' this) ../this}}}
			</div>
		</div>
	{{/each}}
</div>