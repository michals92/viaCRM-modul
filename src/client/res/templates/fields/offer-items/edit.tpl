<div class="offer-items-container">
    {{#each items}}
    <div class="offer-item-row well well-sm" data-index="{{@index}}" style="margin-bottom: 10px;">
        <div class="row">
            <div class="col-sm-3">
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
                    <small class="text-muted">Custom item - you can type any product name</small>
                {{else}}
                    <div class="input-group">
                        <input type="hidden" data-name="productId" value="{{productId}}">
                        <input type="text" class="form-control" data-name="productName" value="{{productName}}" placeholder="Product Name" {{#if productId}}readonly{{/if}}>
                        <span class="input-group-btn">
                            {{#if productId}}
                                <button type="button" class="btn btn-warning" data-action="clearProduct" data-index="{{@index}}" title="Clear Product & Make Custom">
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
                        <small class="text-success">Product selected from catalog</small>
                    {{else}}
                        <small class="text-muted">Click search to select from product catalog</small>
                    {{/if}}
                {{/if}}
            </div>
            <div class="col-sm-1">
                <input type="number" class="form-control" data-name="quantity" value="{{quantity}}" min="1" step="1" placeholder="Qty">
                <small class="text-muted">Quantity</small>
            </div>
            <div class="col-sm-2">
                <input type="number" class="form-control" data-name="unitPrice" value="{{unitPrice}}" min="0" step="0.01" placeholder="Unit Price">
                <small class="text-muted">Unit Price</small>
            </div>
            <div class="col-sm-1">
                <div class="input-group">
                    {{#if isCatalogProduct}}
                        <input type="number" class="form-control" data-name="vat" value="{{vat}}" min="0" max="100" step="1" readonly title="VAT from product catalog">
                    {{else}}
                        <input type="number" class="form-control" data-name="vat" value="{{vat}}" min="0" max="100" step="1" placeholder="VAT %">
                    {{/if}}
                    <span class="input-group-addon">%</span>
                </div>
                {{#if isCatalogProduct}}
                    <small class="text-success">From catalog</small>
                {{else}}
                    <small class="text-muted">VAT</small>
                {{/if}}
            </div>
            <div class="col-sm-2">
                <div class="form-control-static">
                    <div class="item-total-without-vat text-right"><strong>{{totalWithoutVat}}</strong></div>
                    <div class="item-total-with-vat text-right text-primary"><strong>{{totalWithVat}}</strong></div>
                </div>
                <small class="text-muted">Without / With VAT</small>
            </div>
            <div class="col-sm-1">
                <button type="button" class="btn btn-danger btn-sm pull-right" data-action="removeItem" data-index="{{@index}}" title="Remove Item">
                    <span class="fas fa-times"></span>
                </button>
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