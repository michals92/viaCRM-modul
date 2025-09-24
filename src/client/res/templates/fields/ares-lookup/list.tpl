{{#if companyData}}
<span title="{{companyData.name}} (IČO: {{companyData.ico}}{{#if companyData.dic}}, DIČ: {{companyData.dic}}{{/if}})">
    {{companyData.name}}
    <small class="text-muted">
        ({{companyData.ico}}{{#if companyData.dic}}, {{companyData.dic}}{{/if}}{{#ifEqual companyData.country 'SK'}} - SK{{/ifEqual}})
    </small>
</span>
{{/if}}