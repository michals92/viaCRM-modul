<div class='page-header'>
	<h3>
		<a href='#Admin'>{{translate 'Administration'}}</a>
		<span class='breadcrumb-separator'><span class='chevron-right'></span></span>
		<a href='#Admin/entityManager'>{{translate 'Entity Manager' scope='Admin'}}</a>
		<span class='breadcrumb-separator'><span class='chevron-right'></span></span>
		<a href='#Admin/entityManager/scope={{scope}}'>{{translate scope category='scopeNames'}}</a>
		<span class='breadcrumb-separator'><span class='chevron-right'></span></span>
		{{translate 'Colorization' scope='EntityManager'}}
	</h3>
</div>

<div class='button-container'>
	<button class='btn btn-primary' data-action='save'>{{translate 'Save'}}</button>
</div>

<div class='panel panel-default'>
	<div class='panel-heading'>
		<h4 class='panel-title'>{{translate 'Colorization Rules' scope='EntityManager'}}</h4>
	</div>
	<div class='panel-body'>
		<div data-name='colorization-rules'></div>
	</div>
</div>
