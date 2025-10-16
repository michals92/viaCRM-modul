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
                    label: this.translate('Export', 'labels', 'Report'),
                    style: 'primary'
                },
                {
                    name: 'cancel',
                    label: this.translate('Cancel', 'labels', 'Report')
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
                this.notify(this.translate('Please select an export format', 'labels', 'Report'), 'warning');
                return;
            }
            
            const url = `api/v1/Report/${this.model.id}/export?format=${selectedFormat}`;
            window.open(this.getBasePath() + '/' + url, '_blank');
            
            this.close();
        }
    });
});