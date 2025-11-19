<div class="list-group">
	{{#each typeList}}
		<a style="clear: both;" class="layout-link btn btn-link pull-left" data-type="{{./this}}"
		   data-scope="{{../scope}}">
			{{translate this scope='Admin' category='layouts'}}
		</a>
	{{/each}}
</div>
