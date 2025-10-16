define('viacrm:views/report/modals/preview', ['views/modal'], function (Dep) {
    
    return Dep.extend({
        
        className: 'dialog dialog-record',
        
        template: 'viacrm:report/modals/preview',
        
        data() {
            return {
                hasData: this.result.preview && this.result.preview.length > 0,
                total: this.result.total || 0
            };
        },
        
        setup() {
            Dep.prototype.setup.call(this);
            
            this.result = this.options.result;
            this.reportData = this.options.reportData;
            
            this.headerText = this.translate('Data Preview', 'labels', 'Report');
            
            this.buttonList = [
                {
                    name: 'cancel',
                    label: this.translate('Close', 'labels', 'Report')
                }
            ];
        },
        
        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            this.renderPreviewData();
        },
        
        renderPreviewData() {
            const data = this.result.preview;
            
            if (!data || data.length === 0) {
                this.$el.find('.preview-content').html(`<p class="text-muted">${this.translate('No data found with current filters', 'labels', 'Report')}</p>`);
                return;
            }
            
            const headers = Object.keys(data[0]);
            let html = '<div class="table-responsive">';
            html += '<table class="table table-striped table-sm">';
            
            html += '<thead><tr>';
            headers.forEach(header => {
                html += `<th>${this.translate(header, 'fields')}</th>`;
            });
            html += '</tr></thead>';
            
            html += '<tbody>';
            data.forEach(row => {
                html += '<tr>';
                headers.forEach(header => {
                    let value = row[header] || '';
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    if (typeof value === 'string' && value.length > 50) {
                        value = value.substring(0, 50) + '...';
                    }
                    html += `<td>${this.getHelper().escapeString(value)}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody>';
            
            html += '</table>';
            html += '</div>';
            
            if (this.result.total > 10) {
                html += `<p class="text-muted"><em>${this.translate('Showing first {count} of {total} records', 'labels', 'Report').replace('{count}', '10').replace('{total}', this.result.total)}</em></p>`;
            }
            
            this.$el.find('.preview-content').html(html);
        }
    });
});