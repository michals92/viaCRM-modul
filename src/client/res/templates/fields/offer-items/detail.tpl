{{#if items.length}}
<div class="offer-items-detail table-responsive">
    <table class="table table-bordered table-condensed table-hover">
        <thead>
            <tr class="active">
                <th>Produkt</th>
                <th class="text-center" style="min-width: 60px;">Množ.</th>
                <th class="text-right" style="min-width: 80px;">Jedn. cena</th>
                <th class="text-right" style="min-width: 80px;">Sleva</th>
                <th class="text-center" style="min-width: 60px;">DPH %</th>
                <th class="text-right" style="min-width: 90px;">Čistá částka</th>
                <th class="text-right" style="min-width: 100px;">Celkem</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>
                    {{productName}}
                    {{#if productId}}
                        <span class="text-muted small">(#{{productId}})</span>
                    {{/if}}
                </td>
                <td class="text-center">{{quantity}}</td>
                <td class="text-right">{{unitPrice}}</td>
                <td class="text-right">
                    {{#if discountValue}}
                        {{discountValue}}{{#if isDiscountPercent}}%{{else}} {{../currencySymbol}}{{/if}}
                    {{else}}
                        -
                    {{/if}}
                </td>
                <td class="text-center">{{vat}}%</td>
                <td class="text-right">{{totalWithoutVat}}</td>
                <td class="text-right"><strong class="text-primary">{{totalWithVat}}</strong></td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="5" class="text-right">Mezisoučet:</td>
                <td class="text-right">{{subtotalWithoutVat}}</td>
                <td></td>
            </tr>
            {{#if itemDiscountAmount}}
            <tr>
                <td colspan="5" class="text-right">Slevy položek:</td>
                <td class="text-right">-{{itemDiscountAmount}}</td>
                <td></td>
            </tr>
            {{/if}}
            {{#if overallDiscountAmount}}
            <tr>
                <td colspan="5" class="text-right">Celková sleva:</td>
                <td class="text-right">-{{overallDiscountAmount}}</td>
                <td></td>
            </tr>
            {{/if}}
            <tr class="active">
                <td colspan="5" class="text-right"><strong>Celkem bez DPH:</strong></td>
                <td class="text-right"><strong>{{totalWithoutVat}}</strong></td>
                <td></td>
            </tr>
            <tr>
                <td colspan="5" class="text-right">Částka DPH:</td>
                <td class="text-right">{{totalVatAmount}}</td>
                <td></td>
            </tr>
            <tr class="success">
                <td colspan="6" class="text-right"><strong style="font-size: 14px;">Celková částka:</strong></td>
                <td class="text-right"><strong class="text-primary" style="font-size: 18px;">{{totalWithVat}}</strong></td>
            </tr>
        </tfoot>
    </table>
</div>
{{else}}
<span class="none-value">Žádné položky</span>
{{/if}}