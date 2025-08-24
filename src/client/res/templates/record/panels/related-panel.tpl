{{!-- VIA CRM Enhanced Related Panel Template --}}

<div class="panel panel-default viacrm-related-panel{{#if viaCrmConfig.customClass}} {{viaCrmConfig.customClass}}{{/if}}">
    
    {{!-- Enhanced Panel Header --}}
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-8">
                <h4 class="panel-title">
                    {{#if panelIcon}}
                        <span class="viacrm-panel-icon">{{panelIcon}}</span>
                    {{/if}}
                    {{enhancedTitle}}
                    {{#if viaCrmConfig.subtitle}}
                        <small class="text-muted">{{viaCrmConfig.subtitle}}</small>
                    {{/if}}
                </h4>
            </div>
            <div class="col-sm-4">
                <div class="panel-actions pull-right">
                    {{#each buttonList}}
                        <button type="button" class="btn btn-default btn-sm" data-action="{{action}}" {{#if title}}title="{{title}}"{{/if}}>
                            {{{html}}}
                        </button>
                    {{/each}}
                </div>
            </div>
        </div>
        
        {{!-- Enhanced Panel Stats --}}
        {{#if viaCrmConfig.showStats}}
            <div class="viacrm-panel-stats">
                <div class="row">
                    <div class="col-sm-3">
                        <span class="stat-label">Total:</span>
                        <span class="stat-value">{{collection.total}}</span>
                    </div>
                    <div class="col-sm-3">
                        <span class="stat-label">Loaded:</span>
                        <span class="stat-value">{{collection.length}}</span>
                    </div>
                    {{#if viaCrmConfig.customStats}}
                        {{#each viaCrmConfig.customStats}}
                            <div class="col-sm-3">
                                <span class="stat-label">{{label}}:</span>
                                <span class="stat-value">{{value}}</span>
                            </div>
                        {{/each}}
                    {{/if}}
                </div>
            </div>
        {{/if}}
    </div>
    
    {{!-- Panel Body with Enhanced Content --}}
    <div class="panel-body viacrm-panel-body">
        {{#unless collection.length}}
            <div class="viacrm-panel-empty">
                <div class="text-center text-muted">
                    {{#if viaCrmConfig.emptyIcon}}
                        <div class="viacrm-empty-icon">{{viaCrmConfig.emptyIcon}}</div>
                    {{/if}}
                    <p>{{translate 'No Data'}}</p>
                    {{#if viaCrmConfig.emptyMessage}}
                        <small>{{viaCrmConfig.emptyMessage}}</small>
                    {{/if}}
                </div>
            </div>
        {{else}}
            {{!-- Standard relationship content --}}
            <div class="list-container">{{{list}}}</div>
            
            {{!-- Enhanced pagination if needed --}}
            {{#if showMore}}
                <div class="viacrm-show-more text-center">
                    <button type="button" class="btn btn-default" data-action="showMore">
                        {{translate 'Show more'}} {{#if totalCount}}({{totalCount}} total){{/if}}
                    </button>
                </div>
            {{/if}}
        {{/unless}}
    </div>
    
    {{!-- Enhanced Panel Footer --}}
    {{#if viaCrmConfig.footer}}
        <div class="panel-footer viacrm-panel-footer">
            {{#if viaCrmConfig.footer.actions}}
                <div class="footer-actions">
                    {{#each viaCrmConfig.footer.actions}}
                        <button type="button" class="btn btn-sm {{#if className}}{{className}}{{else}}btn-default{{/if}}" data-action="{{action}}">
                            {{#if icon}}<span class="{{icon}}"></span> {{/if}}{{label}}
                        </button>
                    {{/each}}
                </div>
            {{/if}}
            
            {{#if viaCrmConfig.footer.info}}
                <div class="footer-info text-muted">
                    {{viaCrmConfig.footer.info}}
                </div>
            {{/if}}
        </div>
    {{/if}}
    
</div>