{{#if items.length}}
<div class="offer-items-detail table-responsive">
    <table class="table table-bordered table-condensed table-hover">
        <thead>
            <tr class="active">
                <th>Product</th>
                <th class="text-center" style="min-width: 60px;">Qty</th>
                <th class="text-right" style="min-width: 80px;">Unit Price</th>
                <th class="text-center" style="min-width: 60px;">VAT %</th>
                <th class="text-right" style="min-width: 90px;">Net Amount</th>
                <th class="text-right" style="min-width: 100px;">Total</th>
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
                <td class="text-center">{{vat}}%</td>
                <td class="text-right">{{totalWithoutVat}}</td>
                <td class="text-right"><strong class="text-primary">{{totalWithVat}}</strong></td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr class="active">
                <td colspan="4" class="text-right"><strong>Subtotal (Net):</strong></td>
                <td class="text-right"><strong>{{totalWithoutVat}}</strong></td>
                <td></td>
            </tr>
            <tr>
                <td colspan="4" class="text-right">VAT Amount:</td>
                <td class="text-right">{{totalVatAmount}}</td>
                <td></td>
            </tr>
            <tr class="success">
                <td colspan="5" class="text-right"><strong style="font-size: 14px;">Total Amount:</strong></td>
                <td class="text-right"><strong class="text-primary" style="font-size: 18px;">{{totalWithVat}}</strong></td>
            </tr>
        </tfoot>
    </table>
</div>
{{else}}
<span class="none-value">No items</span>
{{/if}}