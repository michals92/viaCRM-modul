{{#if collectionLength}}
    <div class="list-section-mode">
        {{#each rowDataList}}
            <div class="section-item" data-id="{{id}}">
                {{{var id ../this}}}
            </div>
        {{/each}}
    </div>
{{else}}
    <div class="no-data">{{translate 'No Data'}}</div>
{{/if}}