<div class='page-header'>
	<h3>
		<a href='#Admin'>{{translate 'Administration'}}</a>
		<span class='breadcrumb-separator'><span class='chevron-right'></span></span>
		<a href='#Admin/entityManager'>{{translate 'Entity Manager' scope='Admin'}}</a>
		<span class='breadcrumb-separator'><span class='chevron-right'></span></span>
		<a href='#Admin/entityManager/scope={{scope}}'>{{translate scope category='scopeNames'}}</a>
		<span class='breadcrumb-separator'><span class='chevron-right'></span></span>
		{{translate 'Conversions' scope='EntityManager'}}
	</h3>
</div>

<div class='button-container'>
	<button class='btn btn-default btn-wide' data-action='addEntity'>
		<span class='fas fa-plus'></span>
		{{translate 'Add Entity' scope='Admin'}}
	</button>
</div>

<div class='panel panel-default'>
	<div class='panel-heading'>
		<h4 class='panel-title'>{{translate 'Conversion Map' scope='EntityManager'}}</h4>
	</div>
	<div class='panel-body'>
		<table class='table table-bordered'>
			<thead>
				<tr>
					<th>{{translate 'Target Entity' scope='EntityManager'}}</th>
					<th>{{translate 'Attribute Map' scope='EntityManager'}}</th>
				</tr>
			</thead>
			<tbody>
				{{#each conversionData}}
					<tr>
						<td>{{translate @key category='scopeNames'}}</td>
						<td>
							<div data-name='attribute-mapping-{{@index}}'>
								{{{var @key ../this}}}
							</div>
						</td>
					</tr>
				{{/each}}
			</tbody>
		</table>
	</div>
</div>