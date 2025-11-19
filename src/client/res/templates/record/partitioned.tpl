{{#if topBar}}
	<div class="list-buttons-container clearfix">
		{{#if displayTotalCount}}
			<div class="text-muted total-count">
				{{translate 'Total'}}: <span class="total-count-span">{{totalCountFormatted}}</span>
			</div>
		{{/if}}

		{{#each buttonList}}
			{{button name scope=../scope label=label style=style}}
		{{/each}}
	</div>
{{/if}}


{{#if totalCount}}
	<div class="partitioned-container">
		{{#each groupDataList}}
			<div class="partition" data-name="{{name}}">
				<h4 class="partition-header {{#if style}}text-{{style}}{{/if}}">
					{{title}} {{#if ../showCount}}({{totalCountFormatted}}){{/if}}
				</h4>
				{{{var key ../this}}}
			</div>
		{{/each}}
	</div>
{{else}}
	<div>
		{{translate 'No Data'}}
	</div>
{{/if}}
