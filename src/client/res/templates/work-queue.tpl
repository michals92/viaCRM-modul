<div class="page-header">{{{header}}}</div>
{{#if isSetUp}}
<div class="search-container">{{{search}}}</div>
<div class="list-container">{{{list}}}</div>
{{else}}
<div>{{translate 'workQueueNotSetUp' category='messages' scope='WorkQueue'}} - <a href='#Admin/AutocrmSettings'>{{translate 'Set Up' category='labels' scope='WorkQueue'}}</a></div>
{{/if}}