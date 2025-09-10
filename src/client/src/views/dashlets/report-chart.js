define('viacrm:views/dashlets/report-chart', ['views/dashlets/abstract/base'], function (Dep) {

    return Dep.extend({

        name: 'ReportChart',

        template: 'viacrm:dashlets/report-chart',

        setup() {
            Dep.prototype.setup.call(this);
            
            console.log('ReportChart setup called');
            console.log('All options:', this.options);
            console.log('Options data:', this.optionsData);
            
            // For link field, we need to get the ID from optionsData
            this.reportId = this.optionsData?.reportIdId || this.optionsData?.reportId || this.options.reportIdId || this.options.reportId || null;
            this.reportTitle = this.optionsData?.title || this.options.title || 'Report Chart';
            this.refreshInterval = this.optionsData?.refreshInterval || this.options.refreshInterval || 0;
            
            // Initialize display limits for load more functionality
            this.gridDisplayLimit = null;
            this.listDisplayLimit = null;
            
            console.log('Report ID:', this.reportId);
            console.log('Report Title:', this.reportTitle);
            
            if (this.refreshInterval > 0) {
                this.startAutoRefresh();
            }
            
            // Set up options fields from metadata if not already set
            if (!this.optionsFields) {
                this.optionsFields = {
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
                };
            }
        },
        
        getTitle() {
            return this.reportTitle || 'Report Chart';
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);
            
            console.log('ReportChart afterRender called');
            console.log('Report ID in afterRender:', this.reportId);
            
            if (this.reportId) {
                console.log('Loading report data...');
                this.loadReportData();
            } else {
                console.log('No report ID, showing message');
                this.showNoReportMessage();
            }
            
            // Add resize listener for responsive charts
            this.setupResizeListener();
            
            // Add event handlers for load more buttons
            this.setupLoadMoreHandlers();
        },
        
        setupLoadMoreHandlers() {
            // Remove existing handlers to prevent duplicates
            this.$el.off('click.loadmore');
            
            // Add event handlers for load more buttons
            this.$el.on('click.loadmore', '.load-more-grid', () => {
                this.loadMoreGrid();
            });
            
            this.$el.on('click.loadmore', '.load-more-list', () => {
                this.loadMoreList();
            });
        },
        
        loadMoreGrid() {
            const widgetHeight = this.$el.height() || 250;
            const availableHeight = Math.max(150, widgetHeight - 50);
            const currentLimit = this.gridDisplayLimit || Math.max(2, Math.floor((availableHeight - 60) / 100));
            
            // Increase limit by the original amount
            this.gridDisplayLimit = currentLimit + Math.max(2, Math.floor((availableHeight - 60) / 100));
            
            // Re-render the report with new limit
            if (this.reportData) {
                this.renderReport(this.reportData);
            }
        },
        
        loadMoreList() {
            const widgetHeight = this.$el.height() || 250;
            const availableHeight = Math.max(150, widgetHeight - 50);
            const currentLimit = this.listDisplayLimit || Math.max(5, Math.floor((availableHeight - 60) / 35));
            
            // Increase limit by the original amount
            this.listDisplayLimit = currentLimit + Math.max(5, Math.floor((availableHeight - 60) / 35));
            
            // Re-render the report with new limit
            if (this.reportData) {
                this.renderReport(this.reportData);
            }
        },
        
        setupResizeListener() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            // Use ResizeObserver if available, otherwise fall back to window resize
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    if (this.reportData) {
                        setTimeout(() => this.renderReport(this.reportData), 100);
                    }
                });
                this.resizeObserver.observe(this.$el[0]);
            } else {
                // Fallback for older browsers
                const resizeHandler = () => {
                    if (this.reportData) {
                        setTimeout(() => this.renderReport(this.reportData), 100);
                    }
                };
                $(window).on('resize.dashlet-' + this.id, resizeHandler);
            }
        },

        loadReportData() {
            console.log('Loading report data for ID:', this.reportId);
            
            const basePath = window.location.pathname.replace(/\/+$/, '');
            const url = `${basePath}/api/v1/Report/${this.reportId}/run`;
            console.log('Request URL:', url);
            
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json'
            }).done(result => {
                console.log('Report data received:', result);
                this.reportData = result;
                // Reset display limits when loading new data
                this.gridDisplayLimit = null;
                this.listDisplayLimit = null;
                this.renderReport(result);
            }).fail(error => {
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
            
            // Re-setup load more handlers after rendering
            this.setupLoadMoreHandlers();
        },

        renderChart(data) {
            const chartType = (data.chartType || 'Bar').toLowerCase();
            const labels = data.labels || [];
            const values = data.datasets && data.datasets[0] ? data.datasets[0].data : [];
            const colors = data.datasets && data.datasets[0] ? data.datasets[0].backgroundColor : [];
            
            let chartHtml = '<div class="dashlet-chart-container" style="padding: 10px;">';
            
            if (chartType === 'pie' || chartType === 'doughnut') {
                chartHtml += this.renderPieChart(labels, values, colors);
            } else if (chartType === 'line') {
                chartHtml += this.renderLineChart(labels, values, colors);
            } else {
                chartHtml += this.renderBarChart(labels, values, colors);
            }
            
            chartHtml += '</div>';
            
            this.$el.find('.chart-container').html(chartHtml).show();
            this.$el.find('.summary-container').hide();
        },
        
        renderBarChart(labels, values, colors) {
            const maxValue = Math.max(...values, 1);
            
            // Get dynamic height based on widget size
            const widgetHeight = this.$el.height() || 250;
            const chartHeight = Math.max(150, widgetHeight - 80); // Leave space for title and padding
            const barHeight = chartHeight - 40; // Leave space for labels
            
            let html = `<div class="bar-chart" style="display: flex; align-items: end; height: ${chartHeight}px; padding: 10px; background: #f8f8f8; width: 100%; box-sizing: border-box;">`;
            
            labels.forEach((label, index) => {
                const value = values[index] || 0;
                const height = maxValue > 0 ? (value / maxValue) * barHeight : 0;
                const color = colors[index] || '#36A2EB';
                
                // Responsive font size based on widget width
                const widgetWidth = this.$el.width() || 300;
                const fontSize = Math.max(8, Math.min(12, widgetWidth / 30));
                
                html += `<div style="flex: 1; margin: 0 1px; text-align: center; min-width: 0;">
                    <div style="height: ${height}px; background: ${color}; border-radius: 2px 2px 0 0; position: relative; display: flex; align-items: flex-start; justify-content: center; padding-top: 2px;" title="${label}: ${value}">
                        <span style="font-size: ${fontSize}px; color: #333; font-weight: bold;">${value}</span>
                    </div>
                    <div style="font-size: ${fontSize - 1}px; margin-top: 3px; word-wrap: break-word; line-height: 1.1;">${label.length > 8 ? label.substring(0, 8) + '...' : label}</div>
                </div>`;
            });
            
            html += '</div>';
            return html;
        },
        
        renderPieChart(labels, values, colors) {
            const total = values.reduce((sum, val) => sum + val, 0);
            if (total === 0) return '<div>No data</div>';
            
            // Get dynamic size based on widget dimensions
            const widgetWidth = this.$el.width() || 300;
            const widgetHeight = this.$el.height() || 250;
            const availableHeight = Math.max(150, widgetHeight - 80);
            const pieSize = Math.min(widgetWidth * 0.4, availableHeight * 0.7, 200);
            
            let cumulativePercentage = 0;
            const gradientStops = [];
            
            labels.forEach((label, index) => {
                const value = values[index] || 0;
                const percentage = (value / total) * 100;
                const color = colors[index] || `hsl(${(index * 360) / labels.length}, 70%, 60%)`;
                gradientStops.push(`${color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`);
                cumulativePercentage += percentage;
            });
            
            const fontSize = Math.max(8, Math.min(12, widgetWidth / 30));
            const legendSpacing = widgetWidth > 300 ? 15 : 10;
            
            let html = `<div style="display: flex; align-items: center; justify-content: center; height: ${availableHeight}px; padding: 10px; box-sizing: border-box;">`;
            
            // Pie chart
            html += `<div style="width: ${pieSize}px; height: ${pieSize}px; border-radius: 50%; background: conic-gradient(${gradientStops.join(', ')}); flex-shrink: 0;"></div>`;
            
            // Legend - responsive layout
            if (widgetWidth > 250) {
                html += `<div style="margin-left: ${legendSpacing}px; font-size: ${fontSize}px; flex: 1; min-width: 0;">`;
                labels.slice(0, Math.min(6, labels.length)).forEach((label, index) => {
                    const color = colors[index] || `hsl(${(index * 360) / labels.length}, 70%, 60%)`;
                    const percentage = total > 0 ? ((values[index] / total) * 100).toFixed(1) : 0;
                    html += `<div style="margin-bottom: 3px; display: flex; align-items: center;">
                        <span style="display: inline-block; width: ${fontSize}px; height: ${fontSize}px; background: ${color}; margin-right: 5px; border-radius: 2px; flex-shrink: 0;"></span>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${label}: ${values[index]} (${percentage}%)</span>
                    </div>`;
                });
                html += '</div>';
            } else {
                // Small widget - show legend below
                html += '</div><div style="text-align: center; font-size: ' + (fontSize - 1) + 'px; margin-top: 10px;">';
                labels.slice(0, 4).forEach((label, index) => {
                    const color = colors[index] || `hsl(${(index * 360) / labels.length}, 70%, 60%)`;
                    html += `<span style="display: inline-block; margin: 2px;">
                        <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; margin-right: 3px; border-radius: 1px;"></span>
                        ${label.length > 8 ? label.substring(0, 8) + '...' : label}
                    </span>`;
                });
            }
            
            html += '</div>';
            return html;
        },
        
        renderLineChart(labels, values, colors) {
            const maxValue = Math.max(...values, 1);
            
            // Get dynamic size based on widget dimensions
            const widgetWidth = this.$el.width() || 300;
            const widgetHeight = this.$el.height() || 250;
            const availableHeight = Math.max(120, widgetHeight - 100);
            const chartWidth = Math.max(200, widgetWidth - 40);
            const chartHeight = availableHeight;
            const padding = Math.min(30, chartWidth * 0.1);
            
            let html = `<div style="width: 100%; height: ${availableHeight + 20}px; display: flex; justify-content: center; align-items: center; padding: 10px; box-sizing: border-box;">`;
            html += `<svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="background: white; border: 1px solid #eee; max-width: 100%; height: auto;">`;
            
            // Draw grid lines
            const gridLines = 4;
            for (let i = 0; i <= gridLines; i++) {
                const y = padding + (chartHeight - padding * 2) / gridLines * i;
                html += `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>`;
            }
            
            // Calculate points
            const points = [];
            labels.forEach((label, index) => {
                const x = padding + (chartWidth - padding * 2) / Math.max(labels.length - 1, 1) * index;
                const y = chartHeight - padding - (values[index] / maxValue) * (chartHeight - padding * 2);
                points.push({x, y, value: values[index], label});
            });
            
            // Draw line
            if (points.length > 1) {
                const pathData = points.map((point, index) => 
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ');
                html += `<path d="${pathData}" stroke="#36A2EB" stroke-width="3" fill="none"/>`;
            }
            
            // Draw points and labels
            const fontSize = Math.max(8, Math.min(12, chartWidth / 40));
            points.forEach((point, index) => {
                const color = colors[index] || '#36A2EB';
                
                // Point circle
                html += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}" stroke="white" stroke-width="2">
                    <title>${point.label}: ${point.value}</title>
                </circle>`;
                
                // Value labels on points
                if (chartWidth > 200) {
                    html += `<text x="${point.x}" y="${point.y - 8}" text-anchor="middle" font-size="${fontSize}" fill="#333" font-weight="bold">${point.value}</text>`;
                }
                
                // Category labels at bottom (rotated if needed)
                if (labels.length <= 8 || index % Math.ceil(labels.length / 6) === 0) {
                    const labelText = point.label.length > 10 ? point.label.substring(0, 10) + '...' : point.label;
                    if (chartWidth > 300) {
                        html += `<text x="${point.x}" y="${chartHeight - 5}" text-anchor="middle" font-size="${fontSize - 1}" fill="#666">${labelText}</text>`;
                    } else {
                        html += `<text x="${point.x}" y="${chartHeight - 5}" text-anchor="middle" font-size="${fontSize - 1}" fill="#666" transform="rotate(-45 ${point.x} ${chartHeight - 5})">${labelText}</text>`;
                    }
                }
            });
            
            html += '</svg></div>';
            return html;
        },

        renderSummary(data) {
            const widgetWidth = this.$el.width() || 300;
            const widgetHeight = this.$el.height() || 250;
            const availableHeight = Math.max(150, widgetHeight - 50);
            
            // Responsive font sizes based on widget size
            const baseFontSize = Math.max(11, Math.min(16, widgetWidth / 25));
            const headerFontSize = Math.max(13, Math.min(18, widgetWidth / 20));
            
            let html = `<div class="report-summary" style="height: ${availableHeight}px; padding: 10px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column;">
                <div class="summary-stats" style="margin-bottom: 10px; text-align: center; flex-shrink: 0;">
                    <span class="label label-info" style="font-size: ${headerFontSize}px; padding: 4px 8px;">Total: ${data.total}</span>
                </div>`;
            
            if (data.type === 'grid' && data.data) {
                html += this.renderGridData(data, widgetWidth, availableHeight - 60, baseFontSize);
            } else if (data.type === 'list' && data.data && data.data.length > 0) {
                html += this.renderListData(data, widgetWidth, availableHeight - 60, baseFontSize);
            }
            
            html += '</div>';
            
            this.$el.find('.summary-container').html(html).show();
            this.$el.find('.chart-container').hide();
        },
        
        renderGridData(data, widgetWidth, availableHeight, baseFontSize) {
            const groups = Object.keys(data.data);
            const isSmallWidget = widgetWidth < 250;
            
            // Responsive font sizes
            const titleFontSize = Math.max(baseFontSize + 1, 14);
            const contentFontSize = baseFontSize;
            const smallFontSize = Math.max(baseFontSize - 1, 10);
            
            // Calculate display limits
            const defaultMaxItems = Math.max(2, Math.floor(availableHeight / 100));
            const maxItemsToShow = this.gridDisplayLimit || defaultMaxItems;
            
            // Calculate space for potential load more button
            const buttonSpace = groups.length > maxItemsToShow ? 40 : 0;
            const scrollableHeight = Math.max(100, availableHeight - buttonSpace);
            
            let html = `<div style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
                <div class="grid-summary" style="flex: 1; overflow-y: auto; padding-right: 5px; min-height: 0; max-height: ${scrollableHeight}px;">`;
            
            if (isSmallWidget) {
                // Compact view for small widgets
                groups.forEach(groupValue => {
                    const items = data.data[groupValue];
                    const count = items.length;
                    
                    html += `<div style="margin-bottom: 8px; padding: ${Math.max(6, baseFontSize/2)}px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #007bff;">
                        <div style="font-weight: bold; color: #495057; font-size: ${titleFontSize}px; line-height: 1.2;">${groupValue}</div>
                        <div style="color: #6c757d; font-size: ${contentFontSize}px; margin-top: 2px;">${count} items</div>
                    </div>`;
                });
            } else {
                // Full view for larger widgets
                const maxPreviewLength = widgetWidth < 400 ? 12 : 20;
                
                groups.slice(0, maxItemsToShow).forEach(groupValue => {
                    const items = data.data[groupValue];
                    const count = items.length;
                    
                    html += `<div style="margin-bottom: 12px; border: 1px solid #e9ecef; border-radius: 4px;">
                        <div style="background: #f8f9fa; padding: ${Math.max(6, baseFontSize/2)}px ${Math.max(8, baseFontSize/1.5)}px; font-weight: bold; border-bottom: 1px solid #e9ecef; color: #495057; font-size: ${titleFontSize}px;">
                            ${groupValue} (${count} items)
                        </div>
                        <div style="padding: ${Math.max(6, baseFontSize/2)}px ${Math.max(8, baseFontSize/1.5)}px;">`;
                    
                    // Show preview items - use availableHeight instead of widgetHeight
                    const previewCount = availableHeight > 250 ? 3 : 2;
                    const previewItems = items.slice(0, previewCount);
                    
                    previewItems.forEach((item, index) => {
                        const displayFields = Object.keys(item).filter(key => key !== data.groupBy).slice(0, 2);
                        const preview = displayFields.map(field => {
                            let value = item[field] || '';
                            if (typeof value === 'string' && value.length > maxPreviewLength) {
                                value = value.substring(0, maxPreviewLength) + '...';
                            }
                            return `${field}: ${value}`;
                        }).join(' • ');
                        
                        html += `<div style="font-size: ${smallFontSize}px; color: #6c757d; margin-bottom: 3px; line-height: 1.3;">• ${preview}</div>`;
                    });
                    
                    if (items.length > previewCount) {
                        html += `<div style="font-size: ${smallFontSize}px; color: #6c757d; font-style: italic; margin-top: 4px;">... and ${items.length - previewCount} more</div>`;
                    }
                    
                    html += '</div></div>';
                });
                
            }
            
            html += '</div>'; // Close scrollable div
            
            // Add load more button outside scrollable area if needed
            if (groups.length > maxItemsToShow) {
                html += `<div style="flex-shrink: 0; text-align: center; padding: 8px; border-top: 1px solid #e9ecef; background: #f8f9fa;">
                    <div style="color: #6c757d; font-style: italic; font-size: ${Math.max(contentFontSize - 1, 10)}px; margin-bottom: 4px;">
                        Showing ${maxItemsToShow} of ${groups.length} groups
                    </div>
                    <button type="button" class="btn btn-sm btn-default load-more-grid" style="font-size: ${contentFontSize}px;">
                        Load More Groups (${groups.length - maxItemsToShow} remaining)
                    </button>
                </div>`;
            }
            
            html += '</div>'; // Close container div
            return html;
        },
        
        renderListData(data, widgetWidth, availableHeight, baseFontSize) {
            const items = data.data;
            const defaultMaxItems = Math.max(5, Math.floor(availableHeight / 35)); // Dynamic based on height
            const maxItems = this.listDisplayLimit || defaultMaxItems;
            const isSmallWidget = widgetWidth < 300;
            
            // Responsive font sizes
            const cardFontSize = Math.max(baseFontSize - 1, 10);
            const tableFontSize = baseFontSize;
            const footerFontSize = Math.max(baseFontSize - 1, 10);
            
            if (items.length === 0) {
                return `<div style="text-align: center; color: #6c757d; padding: 20px; font-size: ${baseFontSize}px;">No data available</div>`;
            }
            
            // Calculate space for potential load more button
            const buttonSpace = items.length > maxItems ? 40 : 0;
            const scrollableHeight = Math.max(100, availableHeight - buttonSpace);
            
            let html = `<div style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
                <div class="list-preview" style="flex: 1; overflow-y: auto; min-height: 0; max-height: ${scrollableHeight}px;">`;
            
            if (isSmallWidget) {
                // Card view for small widgets
                items.slice(0, maxItems).forEach((item, index) => {
                    const fields = Object.keys(item).slice(0, 3);
                    
                    html += `<div style="margin-bottom: 8px; padding: ${Math.max(6, baseFontSize/2)}px; background: #f8f9fa; border-radius: 4px; border-left: 2px solid #28a745;">`;
                    
                    fields.forEach(field => {
                        let value = item[field] || '';
                        const maxLength = widgetWidth < 250 ? 15 : 20;
                        if (typeof value === 'string' && value.length > maxLength) {
                            value = value.substring(0, maxLength) + '...';
                        }
                        
                        html += `<div style="font-size: ${cardFontSize}px; margin-bottom: 2px; line-height: 1.3;">
                            <span style="font-weight: bold; color: #495057;">${field}:</span> 
                            <span style="color: #6c757d;">${value}</span>
                        </div>`;
                    });
                    
                    html += '</div>';
                });
            } else {
                // Table view for larger widgets
                const headers = Object.keys(items[0]).slice(0, 4);
                
                html += `<table class="table table-striped" style="font-size: ${tableFontSize}px; margin: 0; width: 100%;">
                    <thead style="background: #f8f9fa;">
                        <tr>`;
                
                headers.forEach(header => {
                    html += `<th style="padding: ${Math.max(4, baseFontSize/3)}px ${Math.max(6, baseFontSize/2)}px; border-bottom: 2px solid #dee2e6; font-weight: bold; color: #495057;">${header}</th>`;
                });
                
                html += '</tr></thead><tbody>';
                
                items.slice(0, maxItems).forEach(row => {
                    html += '<tr style="border-bottom: 1px solid #dee2e6;">';
                    headers.forEach(header => {
                        let value = row[header] || '';
                        const maxLength = widgetWidth < 400 ? 20 : 30;
                        if (typeof value === 'string' && value.length > maxLength) {
                            value = value.substring(0, maxLength) + '...';
                        }
                        html += `<td style="padding: ${Math.max(4, baseFontSize/3)}px ${Math.max(6, baseFontSize/2)}px; color: #495057;" title="${row[header] || ''}">${value}</td>`;
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
            }
            
            html += '</div>'; // Close scrollable div
            
            // Add load more button outside scrollable area if needed
            if (items.length > maxItems) {
                html += `<div style="flex-shrink: 0; text-align: center; padding: ${Math.max(8, baseFontSize/1.5)}px; border-top: 1px solid #e9ecef; background: #f8f9fa;">
                    <div style="color: #6c757d; font-style: italic; font-size: ${footerFontSize}px; margin-bottom: 4px;">
                        Showing ${maxItems} of ${items.length} items
                    </div>
                    <button type="button" class="btn btn-sm btn-default load-more-list" style="font-size: ${footerFontSize}px;">
                        Load More Items (${items.length - maxItems} remaining)
                    </button>
                </div>`;
            }
            
            html += '</div>'; // Close container div
            return html;
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
            
            // Clean up resize observer
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            // Clean up window resize listener
            $(window).off('resize.dashlet-' + this.id);
            
            // Clean up load more event handlers
            this.$el.off('click.loadmore');
            
            Dep.prototype.onRemove.call(this);
        },

        actionRefresh() {
            if (this.reportId) {
                this.loadReportData();
            }
        },

        actionOptions() {
            console.log('actionOptions called');
            console.log('Current options data:', this.optionsData);
            console.log('Options fields:', this.optionsFields);
            
            this.createView('options', 'viacrm:views/dashlets/options/report-chart', {
                name: this.name,
                optionsData: this.optionsData,
                fields: this.optionsFields
            }, (view) => {
                console.log('Options view created:', view);
                view.render();
            });
        }
    });
});