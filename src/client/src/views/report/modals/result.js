define('viacrm:views/report/modals/result', ['views/modal'], function (Dep) {
    
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
                    label: this.translate('Export', 'labels', 'Report'),
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: this.translate('Close', 'labels', 'Report')
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
            const data = this.result;
            const chartType = (data.chartType || 'Bar').toLowerCase();
            
            let html = `<div class="chart-container-custom">
                <h4>${this.translate(data.chartType + ' Chart', 'labels', 'Report')}</h4>`;
            
            if (data.labels && data.datasets && data.datasets[0]) {
                const values = data.datasets[0].data;
                const maxValue = Math.max(...values);
                
                if (chartType === 'pie' || chartType === 'doughnut') {
                    // Render pie chart
                    html += this.renderPieChart(data.labels, values, data.datasets[0].backgroundColor);
                } else if (chartType === 'line') {
                    // Render line chart
                    html += this.renderLineChart(data.labels, values, maxValue, data.datasets[0].backgroundColor);
                } else {
                    // Render bar chart (default)
                    html += this.renderBarChart(data.labels, values, maxValue, data.datasets[0].backgroundColor);
                }
                
                // Add data table below chart
                html += '<div class="chart-data-table" style="margin-top: 20px;">';
                html += '<table class="table table-sm table-striped">';
                html += `<thead><tr><th>${this.translate('Category', 'labels', 'Report')}</th><th>${this.translate('Value', 'labels', 'Report')}</th></tr></thead><tbody>`;
                data.labels.forEach((label, index) => {
                    const value = values[index] || 0;
                    html += `<tr><td>${label}</td><td>${value}</td></tr>`;
                });
                html += '</tbody></table></div>';
            }
            
            html += '</div>';
            this.$el.find('.chart-container').html(html);
        },
        
        renderBarChart(labels, values, maxValue, colors) {
            let html = '<div class="bar-chart" style="display: flex; align-items: end; height: 300px; padding: 20px; border: 1px solid #ddd; background: #fafafa;">';
            
            labels.forEach((label, index) => {
                const value = values[index] || 0;
                const height = maxValue > 0 ? (value / maxValue) * 250 : 0;
                const color = colors ? colors[index] : '#36A2EB';
                
                html += `<div class="bar-item" style="flex: 1; margin: 0 5px; text-align: center;">
                    <div class="bar" style="
                        height: ${height}px; 
                        background-color: ${color}; 
                        border-radius: 4px 4px 0 0;
                        margin-bottom: 5px;
                        transition: opacity 0.2s;
                        position: relative;
                    " title="${label}: ${value}">
                        <span style="
                            position: absolute;
                            top: -20px;
                            left: 50%;
                            transform: translateX(-50%);
                            font-size: 12px;
                            font-weight: bold;
                            color: #333;
                        ">${value}</span>
                    </div>
                    <div class="bar-label" style="font-size: 12px; color: #666;">${label}</div>
                </div>`;
            });
            
            html += '</div>';
            return html;
        },
        
        renderLineChart(labels, values, maxValue, colors) {
            const chartHeight = 180;
            const chartWidth = 350;
            const padding = 30;
            const totalWidth = chartWidth + padding * 2;
            const totalHeight = chartHeight + padding * 2;
            
            let html = `<div class="line-chart" style="
                width: 100%; 
                max-width: 450px; 
                margin: 0 auto; 
                padding: 10px; 
                border: 1px solid #ddd; 
                background: #fafafa;
                overflow: hidden;
            ">
                <svg width="100%" height="250" viewBox="0 0 ${totalWidth} ${totalHeight}" style="background: white; display: block;">`;
            
            // Draw grid lines
            for (let i = 0; i <= 5; i++) {
                const y = padding + (chartHeight / 5) * i;
                html += `<line x1="${padding}" y1="${y}" x2="${chartWidth + padding}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
            }
            
            // Calculate points
            const points = [];
            labels.forEach((label, index) => {
                const value = values[index] || 0;
                const x = padding + (chartWidth / Math.max(labels.length - 1, 1)) * index;
                const y = padding + chartHeight - (maxValue > 0 ? (value / maxValue) * chartHeight : 0);
                points.push({ x, y, value, label });
            });
            
            // Draw line
            if (points.length > 1) {
                const pathData = points.map((point, index) => 
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ');
                
                html += `<path d="${pathData}" stroke="#36A2EB" stroke-width="2" fill="none"/>`;
            }
            
            // Draw points
            points.forEach((point, index) => {
                const color = colors ? colors[index] : '#36A2EB';
                html += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}" stroke="white" stroke-width="1">
                    <title>${point.label}: ${point.value}</title>
                </circle>`;
                
                // Add value labels (only if there's space)
                if (point.y > 20) {
                    html += `<text x="${point.x}" y="${point.y - 8}" text-anchor="middle" font-size="10" fill="#333">${point.value}</text>`;
                }
                
                // Add category labels at bottom
                html += `<text x="${point.x}" y="${chartHeight + padding + 20}" text-anchor="middle" font-size="10" fill="#666">${point.label}</text>`;
            });
            
            html += '</svg></div>';
            return html;
        },
        
        renderPieChart(labels, values, colors) {
            const total = values.reduce((sum, val) => sum + val, 0);
            let cumulativePercentage = 0;
            
            let html = '<div class="pie-chart-container" style="display: flex; align-items: center; justify-content: center;">';
            html += '<div class="pie-chart" style="width: 300px; height: 300px; border-radius: 50%; background: conic-gradient(';
            
            // Create conic gradient for pie chart
            const gradientStops = [];
            labels.forEach((label, index) => {
                const value = values[index] || 0;
                const percentage = total > 0 ? (value / total) * 100 : 0;
                const color = colors ? colors[index] : `hsl(${(index * 360) / labels.length}, 70%, 60%)`;
                
                gradientStops.push(`${color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`);
                cumulativePercentage += percentage;
            });
            
            html += gradientStops.join(', ');
            html += ');"></div>';
            
            // Add legend
            html += '<div class="pie-legend" style="margin-left: 20px;">';
            labels.forEach((label, index) => {
                const value = values[index] || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                const color = colors ? colors[index] : `hsl(${(index * 360) / labels.length}, 70%, 60%)`;
                
                html += `<div class="legend-item" style="display: flex; align-items: center; margin-bottom: 5px;">
                    <div style="width: 20px; height: 20px; background-color: ${color}; margin-right: 10px; border-radius: 2px;"></div>
                    <span>${label}: ${value} (${percentage}%)</span>
                </div>`;
            });
            html += '</div></div>';
            
            return html;
        },
        
        renderListData() {
            const data = this.result.data;
            if (!data || data.length === 0) {
                this.$el.find('.report-content').html(`<p>${this.translate('No data found', 'labels', 'Report')}</p>`);
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
                html += `<p><em>${this.translate('Showing first {count} of {total} records', 'labels', 'Report').replace('{count}', '50').replace('{total}', data.length)}. ${this.translate('Use export to get all data', 'labels', 'Report')}.</em></p>`;
            }
            
            this.$el.find('.report-content').html(html);
        },
        
        renderGridData() {
            const data = this.result.data;
            const groupBy = this.result.groupBy;
            
            let html = `<h4>${this.translate('Grouped by: {field}', 'labels', 'Report').replace('{field}', this.translate(groupBy, 'fields'))}</h4>`;
            
            Object.keys(data).forEach(groupValue => {
                const groupData = data[groupValue];
                html += `<div class="panel panel-default">
                    <div class="panel-heading">
                        <h5>${groupValue} (${groupData.length} ${this.translate('records', 'labels', 'Report')})</h5>
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
                        html += `<p><em>${this.translate('Showing first {count} of {total} records in this group', 'labels', 'Report').replace('{count}', '10').replace('{total}', groupData.length)}.</em></p>`;
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