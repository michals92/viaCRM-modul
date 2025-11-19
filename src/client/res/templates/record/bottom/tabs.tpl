<div class="tabs">
	<ul class="nav nav-tabs nav-justified" role="tablist">
		{{#each panelList}}
			<li role="presentation" id="tablink-{{@index}}"
				class="{{#ifEqual @index 0}}active{{/ifEqual}}{{#if hidden}} hidden{{/if}}"
				data-name="{{name}}">
				<a href="#tabpanel-bottom-{{@index}}" aria-controls="{{label}}" role="tab" data-toggle="tab">
					<h4 class="panel-title">
						{{#unless notRefreshable}}
						<span
							style="cursor: pointer;"
							class="action"
							title="{{translate 'clickToRefresh' category='messages'}}"
							data-action="refresh"
							data-panel="{{name}}"
						>
						{{/unless}}
						{{#if titleHtml}}
							{{{titleHtml}}}
						{{else}}
							{{title}}
						{{/if}}
						{{#unless notRefreshable}}
						</span>
						{{/unless}}
					</h4>
				</a>
			</li>
		{{/each}}
	</ul>

	<div class="tab-content">
		{{#each panelList}}
			<div role="tabpanel" class="tab-pane fade {{#ifEqual @index 0}}active in{{/ifEqual}}"
				 id="tabpanel-bottom-{{@index}}">
				<div
					class="panel panel-{{#if style}}{{style}}{{else}}default{{/if}} panel-{{name}}{{#if
						hidden}} hidden{{/if}}"
					data-name="{{name}}"
					data-style="{{#if style}}{{style}}{{/if}}"
				>
					<div class="panel-heading">
						{{#if actionsViewKey}}
						<div class="pull-right btn-group panel-actions-container">{{{var actionsViewKey ../this}}}</div>
						{{/if}}
					</div>

					<div class="panel-body{{#if isForm}} panel-body-form{{/if}}" data-name="{{name}}">
						{{{var name ../this}}}
					</div>
				</div>
			</div>
		{{/each}}
	</div>
</div>
