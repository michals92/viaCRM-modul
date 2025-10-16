define('viacrm:views/report/record/edit', ['views/record/edit'], function (Dep) {
    
    return Dep.extend({
        
        setup() {
            Dep.prototype.setup.call(this);

            this.setupFieldDependency();
            this.setupPreviewButton();
            this.setupDateValidation();
            this.setupDateFilterType();
        },
        
        setupFieldDependency() {
            this.listenTo(this.model, 'change:targetEntity', () => {
                this.updateFieldOptions();
            });
            
            this.listenTo(this.model, 'change:type', () => {
                this.toggleChartFields();
            });
        },
        
        setupPreviewButton() {
            this.dropdownItemList.push({
                name: 'preview',
                label: this.translate('Data Preview', 'labels', 'Report'),
                action: 'previewData'
            });
        },
        
        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            if (this.model.get('targetEntity')) {
                this.updateFieldOptions();
            }
            
            this.toggleChartFields();
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
                const options = fields
                    .filter(field => ['enum', 'varchar', 'bool', 'date'].includes(field.type))
                    .map(field => field.name);
                
                groupByView.params.options = options;
                groupByView.translatedOptions = {};
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
                orderByView.translatedOptions = { '': this.translate('Default', 'labels', 'Report') };
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

        setupDateValidation() {
            this.listenTo(this.model, 'change:dateFrom change:dateTo', () => {
                this.validateDateRange();
                // Debug: Log when date fields change
                console.log('Date fields changed:', {
                    dateFrom: this.model.get('dateFrom'),
                    dateTo: this.model.get('dateTo')
                });
            });
        },

        setupDateFilterType() {
            this.listenTo(this.model, 'change:dateFilterType', () => {
                this.handleDateFilterTypeChange();
            });

            // Handle initial setup
            this.handleDateFilterTypeChange();
        },

        handleDateFilterTypeChange() {
            const dateFilterType = this.model.get('dateFilterType') || 'custom';
            const isCustom = dateFilterType === 'custom';

            // Show/hide date fields based on filter type
            this.toggleField('dateFrom', isCustom);
            this.toggleField('dateTo', isCustom);

            // If not custom, calculate and set date range
            if (!isCustom) {
                const dateRange = this.calculateDateRange(dateFilterType);
                if (dateRange) {
                    this.model.set({
                        dateFrom: dateRange.from,
                        dateTo: dateRange.to
                    }, { silent: true });
                }
            }
        },

        calculateDateRange(filterType) {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const currentDate = today.getDate();
            const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

            let from, to;

            switch (filterType) {
                case 'today':
                    from = today;
                    to = today;
                    break;

                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    from = yesterday;
                    to = yesterday;
                    break;

                case 'thisWeek':
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Monday
                    from = startOfWeek;
                    to = new Date(startOfWeek);
                    to.setDate(startOfWeek.getDate() + 6); // Sunday
                    break;

                case 'lastWeek':
                    const lastWeekStart = new Date(today);
                    lastWeekStart.setDate(today.getDate() - currentDay - 6); // Last Monday
                    from = lastWeekStart;
                    to = new Date(lastWeekStart);
                    to.setDate(lastWeekStart.getDate() + 6); // Last Sunday
                    break;

                case 'thisMonth':
                    from = new Date(currentYear, currentMonth, 1);
                    to = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
                    break;

                case 'lastMonth':
                    from = new Date(currentYear, currentMonth - 1, 1);
                    to = new Date(currentYear, currentMonth, 0); // Last day of last month
                    break;

                case 'thisQuarter':
                    const quarterStart = Math.floor(currentMonth / 3) * 3;
                    from = new Date(currentYear, quarterStart, 1);
                    to = new Date(currentYear, quarterStart + 3, 0); // Last day of quarter
                    break;

                case 'lastQuarter':
                    const lastQuarterStart = Math.floor((currentMonth - 3) / 3) * 3;
                    from = new Date(currentYear, lastQuarterStart, 1);
                    to = new Date(currentYear, lastQuarterStart + 3, 0); // Last day of last quarter
                    break;

                case 'thisYear':
                    from = new Date(currentYear, 0, 1);
                    to = new Date(currentYear, 11, 31); // Dec 31
                    break;

                case 'lastYear':
                    from = new Date(currentYear - 1, 0, 1);
                    to = new Date(currentYear - 1, 11, 31); // Dec 31 of last year
                    break;

                case 'last7Days':
                    from = new Date(today);
                    from.setDate(today.getDate() - 6); // 7 days ago including today
                    to = today;
                    break;

                case 'last30Days':
                    from = new Date(today);
                    from.setDate(today.getDate() - 29); // 30 days ago including today
                    to = today;
                    break;

                case 'last90Days':
                    from = new Date(today);
                    from.setDate(today.getDate() - 89); // 90 days ago including today
                    to = today;
                    break;

                default:
                    return null;
            }

            // Format dates as YYYY-MM-DD
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            return {
                from: formatDate(from),
                to: formatDate(to)
            };
        },

        getEffectiveDateRange() {
            const dateFilterType = this.model.get('dateFilterType') || 'custom';

            if (dateFilterType !== 'custom') {
                return this.calculateDateRange(dateFilterType) || { from: null, to: null };
            }

            return {
                from: this.model.get('dateFrom'),
                to: this.model.get('dateTo')
            };
        },

        validateDateRange() {
            const dateRange = this.getEffectiveDateRange();
            const dateFrom = dateRange.from;
            const dateTo = dateRange.to;

            if (dateFrom && dateTo) {
                if (new Date(dateFrom) > new Date(dateTo)) {
                    this.model.set('dateTo', null);
                    this.notify(this.translate('End date cannot be earlier than start date', 'labels', 'Report'), 'warning');
                }
            }
        },
        
        actionPreviewData() {
            // Get effective date range based on filter type
            const dateRange = this.getEffectiveDateRange();

            const data = {
                targetEntity: this.model.get('targetEntity'),
                columns: this.model.get('columns'),
                groupBy: this.model.get('groupBy'),
                orderBy: this.model.get('orderBy'),
                orderDirection: this.model.get('orderDirection'),
                dateFrom: dateRange.from,
                dateTo: dateRange.to
            };

            // Debug logging - show all model data
            console.log('Report preview data:', data);
            console.log('Full model data:', this.model.toJSON());
            console.log('Date fields specifically:', {
                dateFrom: this.model.get('dateFrom'),
                dateTo: this.model.get('dateTo'),
                modelHasDateFrom: this.model.has('dateFrom'),
                modelHasDateTo: this.model.has('dateTo')
            });

            if (!data.targetEntity) {
                this.notify(this.translate('Target Entity is required for preview', 'labels', 'Report'), 'warning');
                return;
            }

            this.notify(this.translate('Loading preview...', 'labels', 'Report'), 'info');

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
                    this.notify(this.translate('Error loading preview', 'labels', 'Report'), 'error');
                    console.error(error);
                });
        }
    });
});