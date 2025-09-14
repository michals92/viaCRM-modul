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
                
                // Also listen for reportIdId changes (for link fields)
                this.listenTo(reportView.model, 'change:reportIdId', () => {
                    const reportIdId = reportView.model.get('reportIdId');
                });
            }
        },

        updateTitleFromReport(reportId) {
            $.ajax({
                url: `${this.getBasePath()}api/v1/Report/${reportId}`,
                type: 'GET',
                dataType: 'json'
            }).done(report => {
                const titleView = this.getFieldView('title');
                if (titleView && !titleView.model.get('title')) {
                    titleView.model.set('title', report.name);
                }
            }).fail(error => {
                console.error('Error loading report:', error);
            });
        },
        
        fetch() {
            const data = Dep.prototype.fetch.call(this);
            
            // Make sure we capture both reportId and reportIdId for link fields
            const reportView = this.getFieldView('reportId');
            if (reportView && reportView.model) {
                const reportId = reportView.model.get('reportId');
                const reportIdId = reportView.model.get('reportIdId');
                const reportIdName = reportView.model.get('reportIdName');

                // Ensure we save both values
                if (reportIdId) {
                    data.reportId = reportId;
                    data.reportIdId = reportIdId;
                }
            }
            return data;
        }
    });
});