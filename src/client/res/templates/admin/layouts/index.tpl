<div class="page-header"><h3>{{{headerHtml}}}</h3></div>

<div class="row">
	<div id="layouts-menu" class="col-sm-3">
		{{#unless em}}
			<div class="form-group" id="scope-container">
				{{{scope}}}
			</div>
		{{/unless}}
		<div class="form-group">
			{{#if em}}
				<button class="btn btn-block btn-success"
						data-action="showAllLayouts">{{translate 'Show All Layouts' category='labels'
																 scope='Admin'}}</button>
			{{/if}}
			<button class="btn btn-block btn-primary" data-action="addLayout">{{translate 'Add Layout' category='labels'
																						  scope='Admin'}}</button>
		</div>
		<div class="panel-group" id="layout-list">
			{{{layouts}}}
		</div>
	</div>

	<div id="layouts-panel" class="col-sm-9">
		<h4 id="layout-header" style="margin-top: 0;"></h4>
		<div id="layout-content">
			{{{content}}}
		</div>
	</div>
</div>
