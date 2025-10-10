define('viacrm:views/fields/offer-items', ['viacrm:views/fields/base-items'], function (Dep) {

    return Dep.extend({

        type: 'offerItems',
        itemRowClass: 'offer-item-row',
        itemType: 'offerItems',

        listTemplate: 'viacrm:fields/offer-items/list',
        detailTemplate: 'viacrm:fields/offer-items/detail',
        editTemplate: 'viacrm:fields/offer-items/edit'

    });

});