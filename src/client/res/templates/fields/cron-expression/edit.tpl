<div class="cron-expr__view-mode">
    <a class="cron-expr__view-mode_link action" href="javascript:" data-action="setViewMode">
        <i class="far fa-eye"></i>
        <span class="cron-expr__view-mode_text">{{translate viewMode category='labels'
                                                            scope='RecordRecurrence'}}</span>
    </a>
    <span class="cron-expr__view-mode_label">{{translate 'viewMode' category='labels'
                                                         scope='RecordRecurrence'}}</span>
</div>
{{#if isAdvanced}}
    <input type="text" class="main-element form-control" data-name="{{name}}" value="{{value}}" {{#if params.maxLength}}
           maxlength="{{params.maxLength}}"{{/if}} autocomplete="espo-{{name}}">
{{else}}
    <div class="cron-expr__user-friendly"></div>
{{/if}}