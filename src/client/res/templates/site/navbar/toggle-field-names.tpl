<a
	id='nav-toggle-field-names'
	data-action='toggleFieldNames'
	role='button'
	tabindex='0'
	title='{{translate "Show internal field names" scope='Admin'}}'
>
	{{#ifEqual status "enabled"}}
		<i class='fas fa-eye icon'></i>
	{{else}}
		{{#ifEqual status "hidden"}}
			<i class='fas fa-eye-slash icon'></i>
		{{else}}
			<i class='fas fa-power-off icon'></i>
		{{/ifEqual}}
	{{/ifEqual}}
</a>
