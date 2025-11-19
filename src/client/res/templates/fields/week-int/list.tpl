<div class='week-int-list'>
	<div class='week-int-day'>
		<label class='week-int-label'>{{prop (translate 'dayNamesMin' category='lists') '1'}}</label>
		{{#if mondayValue}}
			<span>{{mondayValue}}</span>
		{{else}}
			{{translate 'None'}}
		{{/if}}
	</div>

	<div class='week-int-day'>
		<label class='week-int-label'>{{prop (translate 'dayNamesMin' category='lists') '2'}}</label>
		{{#if tuesdayValue}}
			<span>{{tuesdayValue}}</span>
		{{else}}
			{{translate 'None'}}
		{{/if}}
	</div>

	<div class='week-int-day'>
		<label class='week-int-label'>{{prop (translate 'dayNamesMin' category='lists') '3'}}</label>
		{{#if wednesdayValue}}
			<span>{{wednesdayValue}}</span>
		{{else}}
			{{translate 'None'}}
		{{/if}}
	</div>

	<div class='week-int-day'>
		<label class='week-int-label'>{{prop (translate 'dayNamesMin' category='lists') '4'}}</label>
		{{#if thursdayValue}}
			<span>{{thursdayValue}}</span>
		{{else}}
			{{translate 'None'}}
		{{/if}}
	</div>

	<div class='week-int-day'>
		<label class='week-int-label'>{{prop (translate 'dayNamesMin' category='lists') '5'}}</label>
		{{#if fridayValue}}
			<span>{{fridayValue}}</span>
		{{else}}
			{{translate 'None'}}
		{{/if}}
	</div>

	<div class='week-int-day'>
		<label class='week-int-label'>{{prop (translate 'dayNamesMin' category='lists') '6'}}</label>
		{{#if saturdayValue}}
			<span>{{saturdayValue}}</span>
		{{else}}
			{{translate 'None'}}
		{{/if}}
	</div>

	<div class='week-int-day'>
		<label class='week-int-label'>{{prop (translate 'dayNamesMin' category='lists') '0'}}</label>
		{{#if sundayValue}}
			<span>{{sundayValue}}</span>
		{{else}}
			{{translate 'None'}}
		{{/if}}
	</div>
</div>