define('viacrm:views/report/record/edit', ['views/record/edit'], function (Dep) {
    
    return Dep.extend({
        
        setup() {
            Dep.prototype.setup.call(this);
            
            this.setupFieldDependency();
            this.setupPreviewButton();
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
        
        setupPreviewButton() {
            this.dropdownItemList.push({
                name: 'preview',
                label: 'Preview Data',
                action: 'previewData'
            });
        },
        
        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            if (this.model.get('targetEntity')) {
                this.updateFieldOptions();
            }
            
            this.toggleChartFields();
            this.toggleDateFields();
        },
        
        updateFieldOptions() {
            const targetEntity = this.model.get('targetEntity');
            if (!targetEntity) return;
            
            this.ajaxGetRequest(`Report/action/getEntityFields?entityType=${targetEntity}`)
                .then(fields => {
                    this.updateColumnOptions(fields);
                    this.updateGroupByOptions(fields);
                    this.updateOrderByOptions(fields);
                });
        },
        
        updateColumnOptions(fields) {
            const columnView = this.getFieldView('columns');
            if (columnView) {
                const options = fields.map(field => field.name);
                columnView.params.options = options;
                columnView.translatedOptions = {};
                fields.forEach(field => {
                    columnView.translatedOptions[field.name] = field.label;
                });
                columnView.reRender();
            }
        },
        
        updateGroupByOptions(fields) {
            const groupByView = this.getFieldView('groupBy');
            if (groupByView) {
                const options = [''].concat(
                    fields
                        .filter(field => ['enum', 'varchar', 'bool', 'date'].includes(field.type))
                        .map(field => field.name)
                );
                
                groupByView.params.options = options;
                groupByView.translatedOptions = { '': 'None' };
                fields.forEach(field => {
                    groupByView.translatedOptions[field.name] = field.label;
                });
                groupByView.reRender();
            }
        },
        
        updateOrderByOptions(fields) {
            const orderByView = this.getFieldView('orderBy');
            if (orderByView) {
                const options = [''].concat(fields.map(field => field.name));
                orderByView.params.options = options;
                orderByView.translatedOptions = { '': 'Default' };
                fields.forEach(field => {
                    orderByView.translatedOptions[field.name] = field.label;
                });
                orderByView.reRender();
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
        
        actionPreviewData() {
            const data = {
                targetEntity: this.model.get('targetEntity'),
                columns: this.model.get('columns'),
                filters: this.model.get('filters'),
                groupBy: this.model.get('groupBy'),
                orderBy: this.model.get('orderBy'),
                orderDirection: this.model.get('orderDirection'),
                dateFilter: this.model.get('dateFilter'),
                dateFrom: this.model.get('dateFrom'),
                dateTo: this.model.get('dateTo')
            };
            
            if (!data.targetEntity) {
                this.notify('Target Entity is required for preview', 'warning');
                return;
            }
            
            this.notify('Loading preview...', 'info');
            
            this.ajaxPostRequest('Report/action/preview', data)
                .then(result => {
                    this.createView('previewModal', 'viacrm:views/report/modals/preview', {
                        result: result,
                        reportData: data
                    }, view => {
                        view.render();
                    });
                })
                .catch(error => {
                    this.notify('Error loading preview', 'error');
                    console.error(error);
                });
        }
    });
});