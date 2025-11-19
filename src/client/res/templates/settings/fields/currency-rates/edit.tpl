{{#each rateValues}}
    <div class="input-group">
        <span class="input-group-addon radius-left" style="width: 25%">1 {{@key}} = </span>
        <span class="input-group-item">
            <input
                class="main-element form-control"
                type="text"
                data-currency="{{@key}}"
                value="{{./this}}"
                style="text-align: right;"
            >
        </span>
        <span class="input-group-addon radius-right" style="width: 22%">{{../baseCurrency}}</span>
        <div class="input-group">
            <input
                class="main-element form-control"
                type="text"
                data-for-currency="{{@key}}"
                autocomplete="espo-{{name}}"
                placeholder="{{translate 'Select'}}"
                spellcheck="false"
            >
            <span class="input-group-btn">
                <button
                    data-action="selectCurrency"
                    data-currency="{{@key}}"
                    class="btn btn-default btn-icon"
                    type="button"
                    title="{{translate 'Select'}}"
                ><i class="fas fa-angle-up"></i></button>
            </span>
        </div>
        <input type="hidden" data-name="{{idName}}" value="{{idValue}}">

    </div>
{{/each}}