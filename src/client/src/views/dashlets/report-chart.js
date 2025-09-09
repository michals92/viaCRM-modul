define('viacrm:views/dashlets/report-chart', ['views/dashlets/abstract/base', 'lib/chart'], function (Dep, Chart) {

    return Dep.extend({

        name: 'ReportChart',

        template: 'viacrm:dashlets/report-chart',

        setup() {
            Dep.prototype.setup.call(this);
            
            this.reportId = this.getOption('reportId');
            this.refreshInterval = this.getOption('refreshInterval') || 0;
            
            if (this.refreshInterval > 0) {
                this.startAutoRefresh();
            }
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            if (this.reportId) {
                this.loadReportData();
            } else {
                this.showNoReportMessage();
            }
        },

        loadReportData() {
            this.notify('Loading report...', 'info');
            
            this.ajaxGetRequest(`Report/${this.reportId}/run`)
                .then(result => {
                    this.reportData = result;
                    this.renderReport(result);
                })
                .catch(error => {
                    console.error('Error loading report:', error);
                    this.showErrorMessage();
                });
        },

        renderReport(data) {
            if (data.type === 'chart') {
                this.renderChart(data);
            } else {
                this.renderSummary(data);
            }
            
            this.$el.find('.report-title').text(this.getTitle());
        },

        renderChart(data) {
            const canvas = this.$el.find('#dashletChart')[0];
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            this.chart = new Chart(ctx, {
                type: data.chartType.toLowerCase(),
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                fontSize: 10
                            }
                        }
                    },
                    scales: data.chartType === 'Pie' || data.chartType === 'Doughnut' ? {} : {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                fontSize: 10
                            }
                        },
                        x: {
                            ticks: {
                                fontSize: 10
                            }
                        }
                    }
                }
            });
            
            this.$el.find('.chart-container').show();
            this.$el.find('.summary-container').hide();
        },

        renderSummary(data) {
            let html = `<div class="report-summary">
                <div class="summary-stats">
                    <span class="label label-info">Total: ${data.total}</span>
                </div>`;
            
            if (data.type === 'grid' && data.data) {
                html += '<div class="grid-summary">';
                Object.keys(data.data).slice(0, 5).forEach(groupValue => {
                    const count = data.data[groupValue].length;
                    html += `<div class="grid-item">
                        <strong>${groupValue}:</strong> ${count}
                    </div>`;
                });
                html += '</div>';
            } else if (data.type === 'list' && data.data && data.data.length > 0) {
                html += '<div class="list-preview">';
                const headers = Object.keys(data.data[0]).slice(0, 3);
                html += '<table class="table table-condensed">';
                html += '<thead><tr>';
                headers.forEach(header => {
                    html += `<th>${header}</th>`;
                });
                html += '</tr></thead>';
                html += '<tbody>';
                data.data.slice(0, 3).forEach(row => {
                    html += '<tr>';
                    headers.forEach(header => {
                        let value = row[header] || '';
                        if (typeof value === 'string' && value.length > 20) {
                            value = value.substring(0, 20) + '...';
                        }
                        html += `<td>${this.getHelper().escapeString(value)}</td>`;
                    });
                    html += '</tr>';
                });
                html += '</tbody></table>';
                html += '</div>';
            }
            
            html += '</div>';
            
            this.$el.find('.summary-container').html(html).show();
            this.$el.find('.chart-container').hide();
        },

        showNoReportMessage() {
            this.$el.find('.dashlet-body').html(
                '<div class="text-center text-muted" style="padding: 20px;">' +
                '<p>No report selected</p>' +
                '<p><small>Configure this dashlet to select a report</small></p>' +
                '</div>'
            );
        },

        showErrorMessage() {
            this.$el.find('.dashlet-body').html(
                '<div class="text-center text-danger" style="padding: 20px;">' +
                '<p>Error loading report</p>' +
                '<p><small>Check if the report exists and is active</small></p>' +
                '</div>'
            );
        },

        startAutoRefresh() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
            
            this.refreshTimer = setInterval(() => {
                if (this.reportId) {
                    this.loadReportData();
                }
            }, this.refreshInterval * 60 * 1000); // Convert minutes to milliseconds
        },

        stopAutoRefresh() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        },

        onRemove() {
            this.stopAutoRefresh();
            if (this.chart) {
                this.chart.destroy();
            }
            Dep.prototype.onRemove.call(this);
        },

        actionRefresh() {
            if (this.reportId) {
                this.loadReportData();
            }
        },

        actionOptions() {
            this.createView('options', 'viacrm:views/dashlets/options/report-chart', {
                name: this.name,
                optionsData: this.optionsData,
                fields: this.optionsFields
            }, (view) => {
                view.render();
            });
        },

        optionsFields: {
            'reportId': {
                'type': 'link',
                'entity': 'Report',
                'required': true
            },
            'title': {
                'type': 'varchar',
                'required': true
            },
            'refreshInterval': {
                'type': 'int',
                'min': 0,
                'tooltip': 'Auto-refresh interval in minutes (0 = disabled)'
            }
        }
    });
});