{{#if items.length}}
<div class="offer-items-detail">
    <table class="table table-bordered table-condensed">
        <thead>
            <tr class="active">
                <th>Product</th>
                <th class="text-center" width="60">Qty</th>
                <th class="text-right" width="80">Price</th>
                <th class="text-center" width="60">VAT</th>
                <th class="text-right" width="90">Without VAT</th>
                <th class="text-right" width="90">With VAT</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{productName}}</td>
                <td class="text-center">{{quantity}}</td>
                <td class="text-right">{{unitPrice}}</td>
                <td class="text-center">{{vat}}%</td>
                <td class="text-right">{{totalWithoutVat}}</td>
                <td class="text-right"><strong class="text-primary">{{totalWithVat}}</strong></td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" class="text-right"><strong>Total without VAT:</strong></td>
                <td class="text-right"><strong>{{totalWithoutVat}}</strong></td>
                <td></td>
            </tr>
            <tr>
                <td colspan="4" class="text-right">VAT:</td>
                <td class="text-right">{{totalVatAmount}}</td>
                <td></td>
            </tr>
            <tr class="info">
                <td colspan="4" class="text-right"><strong>Total with VAT:</strong></td>
                <td></td>
                <td class="text-right"><strong class="text-primary" style="font-size: 16px;">{{totalWithVat}}</strong></td>
            </tr>
        </tfoot>
    </table>
</div>
{{else}}
<span class="none-value">None</span>
{{/if}}