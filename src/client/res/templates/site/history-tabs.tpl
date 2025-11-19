<div class="history-tabs">
	{{#each tabs}}
		<div class="history-tab {{#if active}}active{{/if}}" data-tab="{{url}}" data-action="open-tab">
			<span class="title">{{title}}</span>
			<a role="button" class="close-tab" data-action="close-tab"><i class="fas fa-times"></i></a>
		</div>
	{{/each}}
</div>