<div class="ares-lookup-field">
    <div class="row">
        <div class="col-sm-4">
            <input 
                type="text" 
                class="form-control" 
                data-name="icoInput" 
                placeholder="IČO (8 číslic)" 
                maxlength="8"
                autocomplete="off"
            >
            <small class="text-muted">Automatické vyhledání po zadání 8 číslic</small>
        </div>
        <div class="col-sm-6">
            <input 
                type="text" 
                class="form-control" 
                data-name="nameInput" 
                placeholder="Nebo vyhledejte podle názvu firmy" 
                autocomplete="off"
            >
        </div>
        <div class="col-sm-2">
            <div class="btn-group" role="group">
                <button 
                    type="button" 
                    class="btn btn-default" 
                    data-action="searchByIco"
                    title="Vyhledat podle IČO"
                >
                    <span class="fas fa-search"></span>
                </button>
                {{#if companyData}}
                <button 
                    type="button" 
                    class="btn btn-default" 
                    data-action="clearCompany"
                    title="Vymazat"
                >
                    <span class="fas fa-times"></span>
                </button>
                {{/if}}
            </div>
        </div>
    </div>
    
    <div class="company-suggestions" style="display: none; position: relative; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; margin-top: 2px; max-height: 200px; overflow-y: auto;">
        <!-- Suggestions will be populated here -->
    </div>
    
    {{#if companyData}}
    <div class="company-info-display" style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;">
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
        
        {{#if autoFillFields}}
        <div style="margin-top: 10px; border-top: 1px solid #dee2e6; padding-top: 10px;">
            <small class="text-muted">
                <i class="fas fa-info-circle"></i> 
                Automaticky se vyplní: {{#each autoFillFields}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
            </small>
        </div>
        {{/if}}
    </div>
    {{/if}}
</div>

<style>
.company-suggestion {
    padding: 10px 15px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
}

.company-suggestion:hover {
    background-color: #f8f9fa;
}

.company-suggestion:last-child {
    border-bottom: none;
}

.company-name {
    font-weight: 500;
    color: #333;
    margin-bottom: 3px;
}

.company-details {
    font-size: 12px;
    color: #666;
}

.ares-lookup-field input[data-name="icoInput"] {
    font-family: monospace;
}
</style>