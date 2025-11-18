define('viacrm:views/dashlets/kanban', ['views/dashlets/records'], function (Dep) {

    return Dep.extend({

        name: 'Kanban',

        setup: function () {
            Dep.prototype.setup.call(this);

            var recordViews = this.getMetadata().get(['clientDefs', this.scope, 'recordViews'], {}) || {};

            this.listView = recordViews.kanbanDashlet || recordViews.kanban || 'views/record/kanban';

            this.collectionUrl = 'Kanban/' + this.scope;
        },

        getSearchData: function () {
            var searchData = Dep.prototype.getSearchData.call(this);

            var advancedFilters = this.getOption('advancedFilters');

            if (advancedFilters) {
                searchData.advanced = advancedFilters;
            }

            return searchData;
        },

        actionRefresh: function () {
            var listView = this.getView('list');
            var quickCreate = this.getView('quickCreate');

            if (listView && quickCreate && quickCreate.isRendered()) {
                return;
            }

            Dep.prototype.actionRefresh.call(this);
        }
    });
});

