{{#unless isRemoved}}
<div
        id='nav-show-news'
        data-action='showNews'
        style='display: flex; align-items: center; height: 100%; cursor: pointer;'
>
	<i class="fas fa-bolt" style="margin-right: 0.2rem;"></i>
	{{#if changeCount}}
	<span class="ape-news-badge">{{changeCount}}</span>
	{{/if}}
</div>
<div class="dropdown ape-news-container"></div>
{{/unless}}