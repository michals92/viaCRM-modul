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
        {{#ifEqual companyData.country 'SK'}}
        <span class="label label-primary">
            <i class="fas fa-building"></i> Ověřeno v ORSR (SK)
        </span>
        {{else}}
        <span class="label label-default">
            <i class="fas fa-building"></i> Ověřeno v ARES (CZ)
        </span>
        {{/ifEqual}}
    </div>
</div>
{{else}}
<span class="text-muted">{{translate 'None' category='labels'}}</span>
{{/if}}