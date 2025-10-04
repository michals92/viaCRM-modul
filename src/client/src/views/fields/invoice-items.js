define('viacrm:views/fields/invoice-items', ['viacrm:views/fields/base-items'], function (Dep) {

    return Dep.extend({

        type: 'invoiceItems',
        itemRowClass: 'invoice-item-row',
        itemType: 'invoiceItems',

        listTemplate: 'viacrm:fields/invoice-items/list',
        detailTemplate: 'viacrm:fields/invoice-items/detail',
        editTemplate: 'viacrm:fields/invoice-items/edit'

    });

});