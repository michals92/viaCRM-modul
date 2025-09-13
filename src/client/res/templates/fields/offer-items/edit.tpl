<div class="offer-items-container">
    <style>
    .offer-items-container {
        position: relative;
    }
    .offer-items-container .offer-item-row {
        background: #ffffff;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.06);
    }
    .offer-items-container .offer-item-row:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0,123,255,0.12);
        transform: translateY(-2px);
    }
    .offer-items-container .form-group-sm {
        margin-bottom: 8px;
    }
    .offer-items-container .item-label {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
        display: block;
        font-weight: 500;
    }
    .offer-items-container .btn-toggle-discount {
        background: #fff;
        border-color: #ddd;
        color: #555;
        min-width: 35px;
        transition: all 0.2s ease;
    }
    .offer-items-container .btn-toggle-discount:hover {
        background: #007bff;
        color: white;
        border-color: #007bff;
    }
    .offer-items-container .btn-toggle-discount.active {
        background: #28a745;
        color: white;
        border-color: #28a745;
    }
    .offer-items-container .discount-percentage {
        background: #e8f5e8;
        border-color: #28a745;
    }
    .offer-items-container .discount-fixed {
        background: #fff3cd;
        border-color: #ffc107;
    }
    .offer-items-container .totals-summary {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 2px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        margin-top: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .offer-items-container .totals-summary .total-row {
        padding: 6px 12px;
        margin: 2px 0;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    .offer-items-container .totals-summary .total-row:hover {
        background: rgba(0,123,255,0.05);
    }
    .offer-items-container .totals-summary .grand-total {
        background: linear-gradient(45deg, #28a745, #20c997);
        color: white;
        font-weight: bold;
        font-size: 16px;
        padding: 10px 12px;
        border-radius: 6px;
        margin-top: 8px;
    }
    .offer-items-container .product-selected {
        background: #e8f5e8;
        border-left: 4px solid #28a745;
    }
    .offer-items-container .product-custom {
        border-left: 4px solid #ffc107;
    }
    .offer-items-container .add-item-section {
        background: #f8f9fa;
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin-top: 15px;
        transition: all 0.2s ease;
    }
    .offer-items-container .add-item-section:hover {
        border-color: #007bff;
        background: #f0f8ff;
    }
    .offer-items-container .btn-remove-item:hover {
        background: linear-gradient(135deg, #ff5252, #d32f2f) !important;
        transform: scale(1.1) rotate(90deg);
        box-shadow: 0 4px 16px rgba(211, 47, 47, 0.4) !important;
    }
    .offer-items-container .btn-remove-item:active {
        transform: scale(0.95) rotate(90deg);
    }
    @media (max-width: 768px) {
        .offer-items-container .offer-item-row {
            padding: 12px;
        }
        .offer-items-container .offer-item-row .col-xs-12 {
            margin-bottom: 12px;
        }
        .offer-items-container .totals-summary {
            margin-top: 15px;
            padding: 12px;
        }
    }
    @media (max-width: 576px) {
        .offer-items-container .form-control {
            font-size: 14px;
        }
        .offer-items-container .btn {
            font-size: 12px;
            padding: 4px 8px;
        }
    }
    </style>
    
    {{#each items}}
    <div class="offer-item-row {{#if isCatalogProduct}}product-selected{{else}}product-custom{{/if}}" data-index="{{@index}}">
        
        <!-- Product Name Header -->
        <div class="row" style="margin-bottom: 15px; border-bottom: 1px solid #f1f3f4; padding-bottom: 12px;">
            <div class="col-xs-11">
                <h5 style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; display: flex; align-items: center;">
                    <i class="fas fa-box" style="margin-right: 8px; color: #6c757d;"></i>
                    {{#if isCatalogProduct}}
                        <span class="badge" style="background: #28a745; font-size: 10px; margin-right: 10px;">KATALOG</span>
                    {{else}}
                        <span class="badge" style="background: #ffc107; color: #212529; font-size: 10px; margin-right: 10px;">VLASTNÍ</span>
                    {{/if}}
                    Produkt
                </h5>
                {{#if isCustom}}
                    <div class="input-group">
                        <input type="hidden" data-name="productId" value="">
                        <input type="text" class="form-control" data-name="productName" value="{{productName}}" placeholder="Zadejte název produktu..." style="font-size: 15px; border: 1px solid #ced4da;">
                        <span class="input-group-btn">
                            <button type="button" class="btn btn-outline-primary" data-action="selectProduct" data-index="{{@index}}" title="Vyhledat produkty">
                                <i class="fas fa-search"></i>
                            </button>
                        </span>
                    </div>
                {{else}}
                    <div class="input-group">
                        <input type="hidden" data-name="productId" value="{{productId}}">
                        <input type="text" class="form-control" data-name="productName" value="{{productName}}" placeholder="Název produktu" {{#if productId}}readonly{{/if}} style="font-size: 15px; border: 1px solid #ced4da;">
                        <span class="input-group-btn">
                            {{#if productId}}
                                <button type="button" class="btn btn-outline-secondary" data-action="clearProduct" data-index="{{@index}}" title="Změnit na vlastní">
                                    <i class="fas fa-edit"></i>
                                </button>
                            {{else}}
                                <button type="button" class="btn btn-outline-primary" data-action="selectProduct" data-index="{{@index}}" title="Search Products">
                                    <i class="fas fa-search"></i>
                                </button>
                            {{/if}}
                        </span>
                    </div>
                {{/if}}
            </div>
            <div class="col-xs-1 text-right">
                <button type="button" class="btn btn-remove-item" data-action="removeItem" data-index="{{@index}}" title="Odebrat položku" style="
                    margin-top: 24px;
                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(238, 90, 82, 0.3);
                    font-size: 14px;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        
        <!-- Two Column Layout for Fields -->
        <div class="row">
            <div class="col-sm-6" style="border-right: 1px solid #f1f3f4; padding-right: 20px;">
                <h6 style="margin: 0 0 12px 0; color: #495057; font-weight: 500;">
                    <i class="fas fa-cogs" style="margin-right: 6px; color: #6c757d;"></i>
                    Detaily položky
                </h6>
                
                <div class="row">
                    <div class="col-xs-6" style="margin-bottom: 15px;">
                        <label style="font-size: 11px; color: #6c757d; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.5px;">Množství</label>
                        <input type="number" class="form-control text-center" data-name="quantity" value="{{quantity}}" min="0.01" step="any" placeholder="1" style="font-weight: 500;">
                    </div>
                    
                    <div class="col-xs-6" style="margin-bottom: 15px;">
                        <label style="font-size: 11px; color: #6c757d; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.5px;">Jednotková cena</label>
                        <input type="number" class="form-control text-right" data-name="unitPrice" value="{{unitPrice}}" min="0" step="any" placeholder="0.00" style="font-weight: 500;">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-xs-6" style="margin-bottom: 15px;">
                        <label style="font-size: 11px; color: #6c757d; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.5px;">
                            DPH sazba (%)
                            {{#if isCatalogProduct}}
                                <i class="fas fa-lock" style="color: #28a745; margin-left: 4px;" title="Z katalogu"></i>
                            {{/if}}
                        </label>
                        {{#if isCatalogProduct}}
                            <input type="number" class="form-control text-center" data-name="vat" value="{{vat}}" min="0" max="100" step="any" readonly style="background: #e8f5e8; font-weight: 500;">
                        {{else}}
                            <input type="number" class="form-control text-center" data-name="vat" value="{{vat}}" min="0" max="100" step="any" placeholder="0" style="font-weight: 500;">
                        {{/if}}
                    </div>
                    
                    <div class="col-xs-6" style="margin-bottom: 15px;">
                        <label style="font-size: 11px; color: #6c757d; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.5px;">
                            Sleva
                        </label>
                        <div class="input-group">
                            <input type="number" class="form-control text-center" data-name="discountValue" value="{{discountValue}}" min="0" step="any" placeholder="0" style="font-weight: 500;">
                            <span class="input-group-btn">
                                <button type="button" class="btn btn-default btn-sm" data-action="toggleItemDiscountType" data-index="{{@index}}" title="Přepnout typ" style="min-width: 35px;">
                                    {{#if isDiscountPercent}}%{{else}}${{/if}}
                                </button>
                            </span>
                        </div>
                        <input type="hidden" data-name="discountType" value="{{discountType}}">
                    </div>
                </div>
            </div>
            
            <div class="col-sm-6" style="padding-left: 20px;">
                <h6 style="margin: 0 0 12px 0; color: #495057; font-weight: 500;">
                    <i class="fas fa-calculator" style="margin-right: 6px; color: #6c757d;"></i>
                    Výpočty
                </h6>
                
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6c757d; font-size: 13px;">Mezisoučet:</span>
                        <span style="font-weight: 500;" class="item-subtotal">{{subtotal}}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;" class="discount-row" {{#unless discountAmount}}style="display: none !important;"{{/unless}}>
                        <span style="color: #dc3545; font-size: 13px;">Sleva:</span>
                        <span style="color: #dc3545; font-weight: 500;" class="item-discount-amount">{{#if discountAmount}}-{{discountAmount}}{{else}}-0.00{{/if}}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: #6c757d; font-size: 13px;">Čistá částka:</span>
                        <span style="font-weight: 500;" class="item-total-without-vat">{{totalWithoutVat}}</span>
                    </div>
                    
                    <hr style="margin: 12px 0; border-color: #dee2e6;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; color: #2c3e50;">Celkem s DPH:</span>
                        <span style="font-size: 18px; font-weight: 700; color: #28a745;" class="item-total-with-vat">{{totalWithVat}}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {{/each}}
    
    <!-- Add Item Section -->
    <div class="add-item-section">
        <button type="button" class="btn btn-primary btn-lg" data-action="addCustomItem" style="margin-bottom: 10px;">
            <i class="fas fa-plus-circle"></i> Přidat novou položku
        </button>
        <br>
        <small class="text-muted">Klikněte pro přidání nového produktu do této nabídky</small>
    </div>
    
    <!-- Footer Controls -->
    <div class="row" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <div class="col-sm-4">
            <div class="form-group">
                <label class="control-label">
                    <i class="fas fa-percent"></i> Celková sleva
                    <small class="text-muted">(Použito na celkový součet před DPH)</small>
                </label>
                <div class="input-group">
                    <input type="number" class="form-control text-center {{#if isOverallDiscountPercent}}discount-percentage{{else}}discount-fixed{{/if}}" 
                           data-name="overallDiscountValue" value="{{overallDiscountValue}}" min="0" step="any" placeholder="0"
                           title="{{#if isOverallDiscountPercent}}Procento celkové slevy{{else}}Částka celkové slevy{{/if}}" data-toggle="tooltip">
                    <span class="input-group-btn">
                        <button type="button" class="btn btn-toggle-discount {{#if overallDiscountValue}}active{{/if}}" data-action="toggleOverallDiscountType" 
                                title="Přepnout mezi % a pevnou částkou" data-toggle="tooltip">
                            {{#if isOverallDiscountPercent}}
                                <i class="fas fa-percentage"></i>
                            {{else}}
                                <i class="fas fa-dollar-sign"></i>
                            {{/if}}
                        </button>
                    </span>
                </div>
                <small class="help-block">
                    {{#if isOverallDiscountPercent}}
                        <i class="fas fa-info-circle text-info"></i> Procentní sleva z mezisoučtu
                    {{else}}
                        <i class="fas fa-info-circle text-info"></i> Sleva s pevnou částkou
                    {{/if}}
                </small>
            </div>
        </div>
        <div class="col-sm-8">
            <div class="totals-summary">
                <h5 style="margin-top: 0; color: #495057;">
                    <i class="fas fa-calculator"></i> Souhrn objednávky
                </h5>
                
                <div class="total-row">
                    <div class="row">
                        <div class="col-xs-8"><i class="fas fa-list-ul"></i> Mezisoučet:</div>
                        <div class="col-xs-4 text-right"><strong class="subtotal-without-vat">{{subtotalWithoutVat}}</strong></div>
                    </div>
                </div>
                
                {{#if itemDiscountAmount}}
                <div class="total-row">
                    <div class="row">
                        <div class="col-xs-8"><i class="fas fa-tags text-warning"></i> Slevy položek:</div>
                        <div class="col-xs-4 text-right text-warning">-<span class="item-discount-total">{{itemDiscountAmount}}</span></div>
                    </div>
                </div>
                {{/if}}
                
                <div class="total-row">
                    <div class="row">
                        <div class="col-xs-8">Před celkovou slevou:</div>
                        <div class="col-xs-4 text-right"><span class="total-before-overall-discount">{{totalWithoutVatBeforeOverallDiscount}}</span></div>
                    </div>
                </div>
                
                {{#if overallDiscountAmount}}
                <div class="total-row">
                    <div class="row">
                        <div class="col-xs-8"><i class="fas fa-percent text-info"></i> Celková sleva:</div>
                        <div class="col-xs-4 text-right text-info">-<span class="overall-discount-amount">{{overallDiscountAmount}}</span></div>
                    </div>
                </div>
                {{/if}}
                
                <div class="total-row" style="border-top: 1px solid #dee2e6; padding-top: 8px;">
                    <div class="row">
                        <div class="col-xs-8"><strong><i class="fas fa-minus-circle"></i> Celkem bez DPH:</strong></div>
                        <div class="col-xs-4 text-right"><strong class="grand-total-without-vat">{{totalWithoutVat}}</strong></div>
                    </div>
                </div>
                
                <div class="total-row">
                    <div class="row">
                        <div class="col-xs-8"><i class="fas fa-percentage text-muted"></i> Částka DPH:</div>
                        <div class="col-xs-4 text-right text-muted"><span class="grand-total-vat">{{totalVatAmount}}</span></div>
                    </div>
                </div>
                
                <div class="grand-total">
                    <div class="row">
                        <div class="col-xs-8"><i class="fas fa-check-circle"></i> <strong>CELKEM:</strong></div>
                        <div class="col-xs-4 text-right"><strong class="grand-total-with-vat" style="font-size: 18px;">{{totalWithVat}}</strong></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>