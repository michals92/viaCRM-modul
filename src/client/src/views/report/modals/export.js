define('viacrm:views/report/modals/export', ['views/modal'], function (Dep) {
    
    return Dep.extend({
        
        className: 'dialog dialog-record',
        
        template: 'viacrm:report/modals/export',
        
        data() {
            return {
                formats: this.formats.map(format => ({
                    value: format,
                    label: format
                }))
            };
        },
        
        setup() {
            Dep.prototype.setup.call(this);
            
            this.formats = this.options.formats || ['CSV'];
            
            this.headerText = this.translate('Export Report', 'labels', 'Report');
            
            this.buttonList = [
                {
                    name: 'export',
                    label: 'Export',
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: 'Cancel'
                }
            ];
        },
        
        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            if (this.formats.length === 1) {
                this.$el.find('input[type="radio"]').prop('checked', true);
            }
        },
        
        actionExport() {
            const selectedFormat = this.$el.find('input[name="exportFormat"]:checked').val();
            
            if (!selectedFormat) {
                this.notify('Please select an export format', 'warning');
                return;
            }
            
            const url = `Report/${this.model.id}/export?format=${selectedFormat}`;
            window.open(this.getBasePath() + '/' + url, '_blank');
            
            this.close();
        }
    });
});