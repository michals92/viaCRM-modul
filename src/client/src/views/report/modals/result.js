define('viacrm:views/report/modals/result', ['views/modal', 'lib/chart'], function (Dep, Chart) {
    
    return Dep.extend({
        
        className: 'dialog dialog-record',
        
        template: 'viacrm:report/modals/result',
        
        data() {
            return {
                reportName: this.model.get('name'),
                type: this.result.type,
                isChart: this.result.type === 'chart',
                isList: this.result.type === 'list',
                isGrid: this.result.type === 'grid'
            };
        },
        
        setup() {
            Dep.prototype.setup.call(this);
            
            this.result = this.options.result;
            
            this.headerText = this.translate('Report Results', 'labels', 'Report') + ': ' + this.model.get('name');
            
            this.buttonList = [
                {
                    name: 'export',
                    label: 'Export',
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: 'Close'
                }
            ];
        },
        
        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            if (this.result.type === 'chart') {
                this.renderChart();
            } else if (this.result.type === 'list') {
                this.renderListData();
            } else if (this.result.type === 'grid') {
                this.renderGridData();
            }
        },
        
        renderChart() {
            const ctx = this.$el.find('#reportChart')[0].getContext('2d');
            
            new Chart(ctx, {
                type: this.result.chartType.toLowerCase(),
                data: {
                    labels: this.result.labels,
                    datasets: this.result.datasets
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: this.model.get('name')
                        }
                    }
                }
            });
        },
        
        renderListData() {
            const data = this.result.data;
            if (!data || data.length === 0) {
                this.$el.find('.report-content').html('<p>No data found</p>');
                return;
            }
            
            const headers = Object.keys(data[0]);
            let html = '<table class="table table-striped">';
            
            html += '<thead><tr>';
            headers.forEach(header => {
                html += `<th>${this.translate(header, 'fields')}</th>`;
            });
            html += '</tr></thead>';
            
            html += '<tbody>';
            data.slice(0, 50).forEach(row => {
                html += '<tr>';
                headers.forEach(header => {
                    let value = row[header] || '';
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    html += `<td>${this.getHelper().escapeString(value)}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody>';
            
            html += '</table>';
            
            if (data.length > 50) {
                html += `<p><em>Showing first 50 of ${data.length} records. Use export to get all data.</em></p>`;
            }
            
            this.$el.find('.report-content').html(html);
        },
        
        renderGridData() {
            const data = this.result.data;
            const groupBy = this.result.groupBy;
            
            let html = `<h4>Grouped by: ${this.translate(groupBy, 'fields')}</h4>`;
            
            Object.keys(data).forEach(groupValue => {
                const groupData = data[groupValue];
                html += `<div class="panel panel-default">
                    <div class="panel-heading">
                        <h5>${groupValue} (${groupData.length} records)</h5>
                    </div>
                    <div class="panel-body">`;
                
                if (groupData.length > 0) {
                    const headers = Object.keys(groupData[0]);
                    html += '<table class="table table-sm">';
                    html += '<thead><tr>';
                    headers.forEach(header => {
                        html += `<th>${this.translate(header, 'fields')}</th>`;
                    });
                    html += '</tr></thead>';
                    
                    html += '<tbody>';
                    groupData.slice(0, 10).forEach(row => {
                        html += '<tr>';
                        headers.forEach(header => {
                            let value = row[header] || '';
                            if (typeof value === 'object') {
                                value = JSON.stringify(value);
                            }
                            html += `<td>${this.getHelper().escapeString(value)}</td>`;
                        });
                        html += '</tr>';
                    });
                    html += '</tbody></table>';
                    
                    if (groupData.length > 10) {
                        html += `<p><em>Showing first 10 of ${groupData.length} records in this group.</em></p>`;
                    }
                }
                
                html += '</div></div>';
            });
            
            this.$el.find('.report-content').html(html);
        },
        
        actionExport() {
            const formats = this.model.get('exportFormats') || ['CSV'];
            
            if (formats.length === 1) {
                this.exportFormat(formats[0]);
                return;
            }
            
            this.createView('exportModal', 'viacrm:views/report/modals/export', {
                model: this.model,
                formats: formats
            }, view => {
                view.render();
            });
        },
        
        exportFormat(format) {
            const url = `Report/${this.model.id}/export?format=${format}`;
            window.open(this.getBasePath() + '/' + url, '_blank');
        }
    });
});