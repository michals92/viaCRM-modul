<div class='edit-formula'>
	<div class='row'>
		<div data-name='loaderCustomScript' class='cell col-sm-12'>
			<label class='control-label main-label' data-name='loaderCustomScript'>
				{{translate 'loaderCustomScript' category='fields' scope='EntityManager'}}
			</label>
			<div>
				<label class='control-label' data-name='readLoaderCustomScript'>
					{{translate 'detail' category='layouts' scope='Admin'}}
				</label>
				<div class='field' data-name='readLoaderCustomScript'>
					{{{readLoaderCustomScript}}}
				</div>
			</div>
			<div>
				<label class='control-label' data-name='listLoaderCustomScript'>
					{{translate 'list' category='layouts' scope='Admin'}}
				</label>
				<div class='field' data-name='listLoaderCustomScript'>
					{{{listLoaderCustomScript}}}
				</div>
			</div>
		</div>
	</div>
	<div class='row'>
		<div data-name='beforeSaveCustomScript' class='cell col-sm-12'>
			<label class='control-label main-label' data-name='beforeSaveCustomScript'>
				{{translate 'beforeSaveCustomScript' category='fields' scope='EntityManager'}}
			</label>
			<div class='field' data-name='beforeSaveCustomScript'>
				{{{beforeSaveCustomScriptField}}}
			</div>
		</div>
	</div>
</div>