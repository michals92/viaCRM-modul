define('viacrm:views/dashlets/options/report-chart', ['views/dashlets/options/base'], function (Dep) {

    return Dep.extend({

        setup() {
            Dep.prototype.setup.call(this);
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            // Set up report selection field behavior
            const reportView = this.getFieldView('reportId');
            if (reportView) {
                this.listenTo(reportView.model, 'change:reportId', () => {
                    const reportId = reportView.model.get('reportId');
                    if (reportId) {
                        this.updateTitleFromReport(reportId);
                    }
                });
            }
        },

        updateTitleFromReport(reportId) {
            this.ajaxGetRequest(`Report/${reportId}`)
                .then(report => {
                    const titleView = this.getFieldView('title');
                    if (titleView && !titleView.model.get('title')) {
                        titleView.model.set('title', report.name);
                    }
                })
                .catch(error => {
                    console.error('Error loading report:', error);
                });
        }
    });
});