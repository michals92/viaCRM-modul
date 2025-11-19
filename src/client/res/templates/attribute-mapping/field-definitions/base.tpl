<div class='row'>
	<div class='col-sm-3 subject-type'>
		<select class='form-control' name='subjectType'>
			{{options subjectTypeList subjectTypeValue field='subjectType' scope='Workflow'}}
		</select>
	</div>

	<div class='col-sm-5 subject'>
		{{{subject}}}
	</div>
</div>