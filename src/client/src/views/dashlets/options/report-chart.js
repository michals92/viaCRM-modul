define('viacrm:views/dashlets/options/report-chart', ['views/dashlets/options/base'], function (Dep) {

    return Dep.extend({

        setup() {
            Dep.prototype.setup.call(this);
            console.log('Options setup called');
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);
            console.log('Options afterRender called');
            
            // Set up report selection field behavior
            const reportView = this.getFieldView('reportId');
            console.log('Report field view:', reportView);
            
            if (reportView) {
                console.log('Setting up change listener for reportId');
                this.listenTo(reportView.model, 'change:reportId', () => {
                    const reportId = reportView.model.get('reportId');
                    console.log('Report changed to:', reportId);
                    if (reportId) {
                        this.updateTitleFromReport(reportId);
                    }
                });
                
                // Also listen for reportIdId changes (for link fields)
                this.listenTo(reportView.model, 'change:reportIdId', () => {
                    const reportIdId = reportView.model.get('reportIdId');
                    console.log('Report ID changed to:', reportIdId);
                });
            }
        },

        updateTitleFromReport(reportId) {
            console.log('Updating title from report:', reportId);
            $.ajax({
                url: `${this.getBasePath()}api/v1/Report/${reportId}`,
                type: 'GET',
                dataType: 'json'
            }).done(report => {
                console.log('Report loaded:', report);
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
            console.log('Options fetch data (raw):', data);
            
            // Make sure we capture both reportId and reportIdId for link fields
            const reportView = this.getFieldView('reportId');
            if (reportView && reportView.model) {
                const reportId = reportView.model.get('reportId');
                const reportIdId = reportView.model.get('reportIdId');
                const reportIdName = reportView.model.get('reportIdName');
                
                console.log('Report field values:');
                console.log('  reportId:', reportId);
                console.log('  reportIdId:', reportIdId);
                console.log('  reportIdName:', reportIdName);
                
                // Ensure we save both values
                if (reportIdId) {
                    data.reportId = reportId;
                    data.reportIdId = reportIdId;
                }
            }
            
            console.log('Options fetch data (processed):', data);
            return data;
        }
    });
});