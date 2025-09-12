<div class="offer-items-container">
    <style>
    .offer-items-container .offer-item-row {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 12px;
    }
    .offer-items-container .offer-item-row:hover {
        background: #f5f5f5;
        border-color: #d0d0d0;
    }
    .offer-items-container .form-group-sm {
        margin-bottom: 8px;
    }
    .offer-items-container .item-label {
        font-size: 11px;
        color: #777;
        margin-top: 3px;
        display: block;
    }
    @media (max-width: 768px) {
        .offer-items-container .offer-item-row .col-xs-12 {
            margin-bottom: 10px;
        }
    }
    </style>
    
    {{#each items}}
    <div class="offer-item-row" data-index="{{@index}}">
        <div class="row">
            <div class="col-xs-12 col-sm-12 col-md-4 col-lg-4">
                <div class="form-group form-group-sm">
                    {{#if isCustom}}
                        <div class="input-group">
                            <input type="hidden" data-name="productId" value="">
                            <input type="text" class="form-control" data-name="productName" value="{{productName}}" placeholder="Custom Product Name">
                            <span class="input-group-btn">
                                <button type="button" class="btn btn-default" data-action="selectProduct" data-index="{{@index}}" title="Select from Products">
                                    <span class="fas fa-search"></span>
                                </button>
                            </span>
                        </div>
                        <span class="item-label">Custom item</span>
                    {{else}}
                        <div class="input-group">
                            <input type="hidden" data-name="productId" value="{{productId}}">
                            <input type="text" class="form-control" data-name="productName" value="{{productName}}" placeholder="Product Name" {{#if productId}}readonly{{/if}}>
                            <span class="input-group-btn">
                                {{#if productId}}
                                    <button type="button" class="btn btn-warning" data-action="clearProduct" data-index="{{@index}}" title="Clear Product">
                                        <span class="fas fa-times"></span>
                                    </button>
                                {{else}}
                                    <button type="button" class="btn btn-default" data-action="selectProduct" data-index="{{@index}}" title="Select Product">
                                        <span class="fas fa-search"></span>
                                    </button>
                                {{/if}}
                            </span>
                        </div>
                        {{#if productId}}
                            <span class="item-label text-success">From catalog</span>
                        {{else}}
                            <span class="item-label">Click search to select</span>
                        {{/if}}
                    {{/if}}
                </div>
            </div>
            
            <div class="col-xs-4 col-sm-3 col-md-1 col-lg-1">
                <div class="form-group form-group-sm">
                    <input type="number" class="form-control text-center" data-name="quantity" value="{{quantity}}" min="0.01" step="any" placeholder="1">
                    <span class="item-label">Qty</span>
                </div>
            </div>
            
            <div class="col-xs-8 col-sm-4 col-md-2 col-lg-2">
                <div class="form-group form-group-sm">
                    <input type="number" class="form-control text-right" data-name="unitPrice" value="{{unitPrice}}" min="0" step="any" placeholder="0.00">
                    <span class="item-label">Unit Price</span>
                </div>
            </div>
            
            <div class="col-xs-6 col-sm-3 col-md-2 col-lg-2">
                <div class="form-group form-group-sm">
                    {{#if isCatalogProduct}}
                        <input type="number" class="form-control text-center" data-name="vat" value="{{vat}}" min="0" max="100" step="any" readonly title="VAT from catalog">
                    {{else}}
                        <input type="number" class="form-control text-center" data-name="vat" value="{{vat}}" min="0" max="100" step="any" placeholder="0">
                    {{/if}}
                    {{#if isCatalogProduct}}
                        <span class="item-label text-success">From catalog (%)</span>
                    {{else}}
                        <span class="item-label">VAT Rate (%)</span>
                    {{/if}}
                </div>
            </div>
            
            <div class="col-xs-6 col-sm-3 col-md-2 col-lg-2">
                <div class="form-group form-group-sm">
                    <div class="text-right" style="padding-top: 2px;">
                        <div class="item-total-without-vat"><span style="font-size: 12px; color: #888;">Net:</span> <strong>{{totalWithoutVat}}</strong></div>
                        <div class="item-total-with-vat"><span style="font-size: 12px; color: #888;">Total:</span> <strong class="text-primary" style="font-size: 15px;">{{totalWithVat}}</strong></div>
                    </div>
                </div>
            </div>
            
            <div class="col-xs-12 col-sm-1 col-md-1 col-lg-1">
                <div class="form-group form-group-sm text-right">
                    <button type="button" class="btn btn-danger btn-sm" data-action="removeItem" data-index="{{@index}}" title="Remove Item">
                        <span class="fas fa-trash"></span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    {{/each}}
    
    <div class="row">
        <div class="col-sm-6">
            <button type="button" class="btn btn-default" data-action="addCustomItem">
                <span class="fas fa-plus"></span> Add Item
            </button>
        </div>
        <div class="col-sm-6">
            <div class="text-right">
                <table class="table table-condensed" style="margin: 0; width: auto; display: inline-block;">
                    <tr>
                        <td class="text-right"><strong>Total without VAT:</strong></td>
                        <td class="text-right"><strong class="grand-total-without-vat">{{totalWithoutVat}}</strong></td>
                    </tr>
                    <tr>
                        <td class="text-right">VAT:</td>
                        <td class="text-right"><span class="grand-total-vat">{{totalVatAmount}}</span></td>
                    </tr>
                    <tr class="active">
                        <td class="text-right"><strong>Total with VAT:</strong></td>
                        <td class="text-right"><strong class="text-primary grand-total-with-vat" style="font-size: 16px;">{{totalWithVat}}</strong></td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</div>