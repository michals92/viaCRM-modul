define('viacrm:views/report/record/detail', ['views/record/detail'], function (Dep) {
    
    return Dep.extend({
        
        setup() {
            Dep.prototype.setup.call(this);
            
            this.setupButtons();
            this.setupFieldDependency();
        },
        
        setupButtons() {
            // Add buttons to top bar - use proper EspoCRM format
            this.buttonList.push({
                name: 'runReport',
                label: 'Run Report',
                style: 'success',
                action: 'runReport'
            });
            
            this.buttonList.push({
                name: 'exportReport',
                label: 'Export',
                style: 'primary', 
                action: 'exportReport'
            });
            
            // Also add to dropdown
            this.dropdownItemList.push({
                name: 'runReport',
                label: 'Run Report',
                action: 'runReport'
            });
            
            this.dropdownItemList.push({
                name: 'exportReport',
                label: 'Export',
                action: 'exportReport'
            });
        },
        
        setupFieldDependency() {
            this.listenTo(this.model, 'change:targetEntity', () => {
                this.updateFieldOptions();
            });
            
            this.listenTo(this.model, 'change:type', () => {
                this.toggleChartFields();
            });
            
            this.listenTo(this.model, 'change:dateFilter', () => {
                this.toggleDateFields();
            });
        },
        
        updateFieldOptions() {
            const targetEntity = this.model.get('targetEntity');
            if (!targetEntity) return;
            
            $.ajax({
                url: `api/v1/Report/action/getEntityFields?entityType=${targetEntity}`,
                type: 'GET'
            }).then(fields => {
                    this.updateColumnOptions(fields);
                    this.updateGroupByOptions(fields);
                    this.updateOrderByOptions(fields);
                });
        },
        
        updateColumnOptions(fields) {
            const columnView = this.getFieldView('columns');
            if (columnView) {
                const options = fields.map(field => ({
                    value: field.name,
                    label: field.label
                }));
                columnView.setOptionList(options);
            }
        },
        
        updateGroupByOptions(fields) {
            const groupByView = this.getFieldView('groupBy');
            if (groupByView) {
                const options = fields
                    .filter(field => ['enum', 'varchar', 'bool'].includes(field.type))
                    .map(field => ({
                        value: field.name,
                        label: field.label
                    }));
                groupByView.setOptionList(options);
            }
        },
        
        updateOrderByOptions(fields) {
            const orderByView = this.getFieldView('orderBy');
            if (orderByView) {
                const options = fields.map(field => ({
                    value: field.name,
                    label: field.label
                }));
                orderByView.setOptionList(options);
            }
        },
        
        toggleChartFields() {
            const type = this.model.get('type');
            const isChart = type === 'Chart';
            
            this.toggleField('chartType', isChart);
        },
        
        toggleDateFields() {
            const dateFilter = this.model.get('dateFilter');
            const isCustom = dateFilter === 'custom';
            
            this.toggleField('dateFrom', isCustom);
            this.toggleField('dateTo', isCustom);
        },
        
        toggleField(fieldName, show) {
            const fieldView = this.getFieldView(fieldName);
            if (fieldView) {
                if (show) {
                    fieldView.$el.closest('.cell').removeClass('hidden');
                } else {
                    fieldView.$el.closest('.cell').addClass('hidden');
                }
            }
        },
        
        actionRunReport() {
            
            if (!this.model.id) {
                this.notify('Report must be saved first', 'warning');
                return;
            }
            
            this.notify('Running report...', 'info');
            
            $.ajax({
                url: `api/v1/Report/${this.model.id}/run`,
                type: 'GET'
            }).done(result => {
                this.notify('Report completed!', 'success');
                
                this.createView('reportResult', 'viacrm:views/report/modals/result', {
                    model: this.model,
                    result: result
                }, view => {
                    view.render();
                });
            }).fail(error => {
                this.notify('Error running report', 'error');
                console.error('Report error:', error);
            });
        },
        
        actionExportReport() {
            
            if (!this.model.id) {
                this.notify('Report must be saved first', 'warning');
                return;
            }
            
            const exportFormats = this.model.get('exportFormats') || ['CSV'];
            
            if (exportFormats.length === 1) {
                this.exportFormat(exportFormats[0]);
                return;
            }
            
            this.createView('exportModal', 'viacrm:views/report/modals/export', {
                model: this.model,
                formats: exportFormats
            }, view => {
                view.render();
            });
        },
        
        exportFormat(format) {
            const url = `api/v1/Report/${this.model.id}/export?format=${format}`;
            window.open(url, '_blank');
        }
    });
});