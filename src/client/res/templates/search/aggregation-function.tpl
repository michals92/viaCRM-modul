<div class="form-group">
	<a
		role="button"
		tabindex="0"
		class="remove-function pull-right"
		data-name="{{name}}"
	><i class="fas fa-times"></i></a>
	<label class="control-label small" data-name="{{name}}">
		{{translate function category='aggregationFunctions'}}:
		{{translate field scope=scope category='fields'}}
	</label>
	<div class="field" data-name="{{name}}">{{{view}}}</div>
</div>


