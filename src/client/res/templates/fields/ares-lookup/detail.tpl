{{#if companyData}}
<div class="ares-company-display">
    <div class="row">
        <div class="col-sm-6">
            <strong>{{companyData.name}}</strong>
            <br><small class="text-muted">IČO: {{companyData.ico}}</small>
            {{#if companyData.dic}}
            <br><small class="text-muted">DIČ: {{companyData.dic}}</small>
            {{/if}}
        </div>
        <div class="col-sm-6">
            {{#if companyData.address}}
            <small class="text-muted">{{companyData.address}}</small>
            {{/if}}
            {{#if companyData.city}}
            <br><small class="text-muted">{{companyData.city}}{{#if companyData.zip}} {{companyData.zip}}{{/if}}</small>
            {{/if}}
        </div>
    </div>
    <div style="margin-top: 8px;">
        <span class="label label-default">
            <i class="fas fa-building"></i> Ověřeno v ARES
        </span>
    </div>
</div>
{{else}}
<span class="text-muted">{{translate 'None' category='labels'}}</span>
{{/if}}