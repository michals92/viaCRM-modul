<div class="link-container list-group dynamic-checklist-field">
	{{#each itemHtmlList}}
		{{{./this}}}
	{{/each}}
</div>
<div class="array-control-container">
	<div class="input-group addItem">
		<input class="main-element form-control select addItem"
			   type="text"
			   autocomplete="espo-{{name}}"
			   placeholder="{{translate 'typeAndPressEnter' category='messages'}}"
			   maxlength="{{maxItemLength}}">
		<span class="input-group-btn">
            <button
				data-action="addItem"
				class="btn btn-default btn-icon"
				type="button"
				tabindex="-1"
				title="{{translate 'Add Item'}}">
                <span class="fas fa-plus"></span>
            </button>
        </span>
	</div>
</div>
