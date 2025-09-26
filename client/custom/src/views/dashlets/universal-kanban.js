define('viacrm:views/dashlets/universal-kanban', ['views/dashlets/abstract/base'], function (Dep) {
    
    return Dep.extend({

        name: 'UniversalKanban',
        
        _template: '<div class="dashlet-body"><div class="kanban-container" style="height: 100%; overflow: hidden;"></div></div>',

        setup: function() {
            Dep.prototype.setup.call(this);
            
            this.entityType = this.getOption('entityType') || 'Task';
            this.statusField = this.getOption('statusField') || this.getDefaultStatusField();
            this.refreshInterval = this.getOption('autorefreshInterval') || 0;
            this.maxRecords = this.getOption('maxRecords') || 100;
            
            // Load custom CSS via style tag
            this.loadCustomStyles();
            
            this.wait(true);
            this.getMetadata().load().then((function() {
                this.wait(false);
            }).bind(this));
            
            if (this.refreshInterval > 0) {
                this.startAutoRefresh();
            }
        },

        getKanbanEntitiesList: function() {
            const entityList = this.getMetadata().getScopeList() || [];
            const kanbanEntities = [];
            
            entityList.forEach(entityName => {
                const entityDefs = this.getMetadata().get(['entityDefs', entityName]);
                const scopeDefs = this.getMetadata().get(['scopes', entityName]);
                
                if (!entityDefs || !entityDefs.fields) return;
                
                // Check if entity has any field that could be used for status (enum type)
                const hasStatusField = Object.keys(entityDefs.fields).some(fieldName => {
                    const field = entityDefs.fields[fieldName];
                    return field.type === 'enum' && field.options && field.options.length > 1;
                });
                
                // More relaxed scope validation - just check if it's a real entity
                const isValidScope = scopeDefs && 
                                   scopeDefs.entity !== false && 
                                   !scopeDefs.disabled &&
                                   // Only exclude obvious system entities
                                   !entityName.match(/^(User|Team|Role|Portal|Integration|Import|Export|Attachment|Note|Email|EmailTemplate|EmailFilter|EmailAccount|InboundEmail|Job|ScheduledJob|AuthToken|ActionHistoryRecord|ArrayValue|Autofollow|Cleanup|Dashboard|Extension|ExternalAccount|GroupEmailFolder|Layout|Mass|Pdf|Preferences|Settings|Stream|Template|Webhook|LogRecord|PasswordChangeRequest|TwoFactorCode|Currency|Language)$/);
                
                if (hasStatusField && isValidScope) {
                    kanbanEntities.push(entityName);
                }
            });
            
            // Sort alphabetically and ensure common entities are at the top
            const priorityEntities = ['Task', 'Lead', 'Opportunity', 'Case', 'Order', 'Offer', 'Account', 'Contact'];
            const sortedEntities = kanbanEntities.sort((a, b) => {
                const aPriority = priorityEntities.indexOf(a);
                const bPriority = priorityEntities.indexOf(b);
                
                if (aPriority !== -1 && bPriority !== -1) {
                    return aPriority - bPriority;
                } else if (aPriority !== -1) {
                    return -1;
                } else if (bPriority !== -1) {
                    return 1;
                } else {
                    return a.localeCompare(b);
                }
            });
            
            return sortedEntities.length > 0 ? sortedEntities : ['Task'];
        },

        getDefaultStatusField: function() {
            // First try common status field names
            const commonStatusFields = ['status', 'stage', 'state'];
            
            const entityDefs = this.getMetadata().get(['entityDefs', this.entityType]);
            if (!entityDefs || !entityDefs.fields) {
                return 'status'; // fallback
            }
            
            // Look for common status field names first
            for (const fieldName of commonStatusFields) {
                const field = entityDefs.fields[fieldName];
                if (field && field.type === 'enum' && field.options && field.options.length > 1) {
                    return fieldName;
                }
            }
            
            // If no common field found, look for any enum field that could be a status
            const statusFields = Object.keys(entityDefs.fields).filter(fieldName => {
                const field = entityDefs.fields[fieldName];
                return field.type === 'enum' && 
                       field.options && 
                       field.options.length > 1 &&
                       !field.notStorable &&
                       !fieldName.match(/^(type|priority|source|assigned|created|modified)$/i);
            });
            
            // Prefer fields with status-like names
            const statusLikeField = statusFields.find(fieldName => 
                fieldName.match(/status|stage|state|phase|step/i)
            );
            
            return statusLikeField || statusFields[0] || 'status';
        },

        afterRender: function() {
            Dep.prototype.afterRender.call(this);
            this.loadKanbanData();
        },

        loadKanbanData: function() {
            const url = 'api/v1/' + this.entityType;
            
            // Build select fields based on what's available in the entity
            const selectFields = ['id'];
            const entityDefs = this.getMetadata().get(['entityDefs', this.entityType]) || {};
            const availableFields = entityDefs.fields || {};
            
            // Add name or title field
            if (availableFields.name) {
                selectFields.push('name');
            } else if (availableFields.title) {
                selectFields.push('title');
            } else if (availableFields.subject) {
                selectFields.push('subject');
            } else if (availableFields.description) {
                selectFields.push('description');
            }
            
            // Add status field
            if (this.statusField && availableFields[this.statusField]) {
                selectFields.push(this.statusField);
            }
            
            // Add optional fields if they exist
            if (availableFields.assignedUser) {
                selectFields.push('assignedUserName');
            }
            if (availableFields.createdAt) {
                selectFields.push('createdAt');
            }
            // Only add kanbanOrder if it exists
            if (availableFields.kanbanOrder) {
                selectFields.push('kanbanOrder');
            }
            
            // Build request parameters
            const requestParams = {
                select: selectFields.join(','),
                maxSize: this.maxRecords
            };
            
            // Only add orderBy if we have a field to order by
            if (availableFields.kanbanOrder) {
                requestParams.orderBy = 'kanbanOrder';
                requestParams.order = 'asc';
            } else if (availableFields.createdAt) {
                requestParams.orderBy = 'createdAt';
                requestParams.order = 'desc';
            }
            // If no orderBy field available, don't specify ordering
            
            console.log('Loading data for entity:', this.entityType, 'with params:', requestParams);
            
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json',
                data: requestParams
            }).done((function(result) {
                this.renderKanban(result.list || []);
            }).bind(this)).fail((function(error) {
                console.error('Error loading kanban data:', error);
                // Check if the error is due to missing fields
                if (error.status === 500) {
                    console.error('API Error - Entity ' + this.entityType + ' might not be properly configured');
                    console.error('Available fields:', Object.keys(availableFields));
                    if (error.responseJSON) {
                        console.error('Server error details:', error.responseJSON);
                    }
                    
                    // Show a more helpful error message
                    this.showConfigurationError();
                } else if (error.status === 403) {
                    this.showAccessError();
                } else {
                    this.showErrorMessage();
                }
            }).bind(this));
        },

        renderKanban: function(records) {
            const grouped = this.groupRecordsByStatus(records);
            const statusOptions = this.getStatusOptions();
            
            let html = '<div class="kanban-board" style="display: flex; overflow-x: auto; height: 100%; padding: 10px; gap: 10px;">';
            
            statusOptions.forEach(status => {
                const statusRecords = grouped[status] || [];
                html += this.renderKanbanColumn(status, statusRecords);
            });
            
            html += '</div>';
            
            this.$el.find('.kanban-container').html(html);
            this.setupDragAndDrop();
            this.setupCardActions();
        },

        renderKanbanColumn: function(status, records) {
            const widgetHeight = this.$el.height() || 300;
            const columnHeight = Math.max(200, widgetHeight - 80);
            const statusLabel = this.getLanguage().translateOption(status, this.statusField, this.entityType) || status;
            
            let html = `
                <div class="kanban-column" data-status="${status}" 
                     style="flex: 0 0 220px; background: #f8f9fa; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div class="kanban-header" 
                         style="background: #495057; color: white; padding: 10px; text-align: center; font-weight: bold; font-size: 13px;">
                        ${this.escapeHtml(statusLabel)} (${records.length})
                    </div>
                    <div class="kanban-cards" 
                         style="padding: 8px; height: ${columnHeight - 50}px; overflow-y: auto;" 
                         data-status="${status}">
            `;
            
            records.forEach(record => {
                html += this.renderKanbanCard(record);
            });
            
            html += '</div></div>';
            return html;
        },

        renderKanbanCard: function(record) {
            // Get display name - handle different field names
            let displayName = record.name || record.title || record.subject || '';
            
            // If no display name found, try description (truncated) or use ID
            if (!displayName) {
                if (record.description) {
                    displayName = record.description.substring(0, 50) + (record.description.length > 50 ? '...' : '');
                } else {
                    displayName = 'Record #' + record.id;
                }
            }
            
            const assignedUser = record.assignedUserName ? '<div style="font-size: 10px; color: #6c757d; margin-top: 4px;">👤 ' + this.escapeHtml(record.assignedUserName) + '</div>' : '';
            const createdAt = record.createdAt ? '<div style="font-size: 10px; color: #6c757d; margin-top: 2px;">📅 ' + this.getDateTime().toDisplay(record.createdAt) + '</div>' : '';
            const status = record[this.statusField] || 'No Status';
            
            return '\n' +
                '<div class="kanban-card" data-id="' + record.id + '" data-status="' + status + '"\n' +
                '     style="background: white; border: 1px solid #dee2e6; border-radius: 4px; \n' +
                '            padding: 8px; margin-bottom: 8px; cursor: move; box-shadow: 0 2px 4px rgba(0,0,0,0.05);\n' +
                '            transition: all 0.2s ease; position: relative;">\n' +
                '    <div class="card-actions" style="position: absolute; top: 4px; right: 4px; opacity: 0; transition: opacity 0.2s;">\n' +
                '        <button class="btn btn-sm btn-link view-record" data-id="' + record.id + '" title="Zobrazit záznam" style="padding: 2px 4px; font-size: 10px;">👁</button>\n' +
                '    </div>\n' +
                '    <div style="font-weight: bold; margin-bottom: 4px; font-size: 12px; padding-right: 20px;">\n' +
                '        ' + this.escapeHtml(displayName) + '\n' +
                '    </div>\n' +
                '    <div style="font-size: 10px; color: #6c757d;">ID: ' + record.id + '</div>\n' +
                '    ' + assignedUser + '\n' +
                '    ' + createdAt + '\n' +
                '</div>\n';
        },

        groupRecordsByStatus: function(records) {
            const grouped = {};
            
            records.forEach(record => {
                const status = record[this.statusField] || 'No Status';
                if (!grouped[status]) {
                    grouped[status] = [];
                }
                grouped[status].push(record);
            });
            
            // Sort each group by kanbanOrder (ascending), then by createdAt (descending)
            Object.keys(grouped).forEach(status => {
                grouped[status].sort((a, b) => {
                    const orderA = parseInt(a.kanbanOrder) || 999999;
                    const orderB = parseInt(b.kanbanOrder) || 999999;
                    
                    if (orderA !== orderB) {
                        return orderA - orderB;
                    }
                    
                    // If same order or both null, sort by createdAt descending
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
            });
            
            return grouped;
        },

        getStatusOptions: function() {
            try {
                const entityDefs = this.getMetadata().get(['entityDefs', this.entityType]) || {};
                const fieldDef = entityDefs.fields && entityDefs.fields[this.statusField];
                
                if (fieldDef && fieldDef.options) {
                    return fieldDef.options;
                }
            } catch (e) {
                console.warn('Could not get status options from metadata:', e);
            }
            
            // Dynamic fallback - try to find any enum field options
            try {
                const entityDefs = this.getMetadata().get(['entityDefs', this.entityType]) || {};
                if (entityDefs.fields) {
                    // Look for any enum field that could provide status options
                    const enumFields = Object.keys(entityDefs.fields).filter(fieldName => {
                        const field = entityDefs.fields[fieldName];
                        return field.type === 'enum' && field.options && field.options.length > 1;
                    });
                    
                    if (enumFields.length > 0) {
                        const firstEnumField = entityDefs.fields[enumFields[0]];
                        if (firstEnumField.options) {
                            return firstEnumField.options;
                        }
                    }
                }
            } catch (e) {
                console.warn('Could not get fallback enum options:', e);
            }
            
            // Ultimate fallback
            return ['New', 'In Progress', 'Completed'];
        },

        setupDragAndDrop: function() {
            this.$el.find('.kanban-card').attr('draggable', true);
            
            this.$el.off('.kanban-drag');
            
            // Initialize drag state
            this.draggedElement = null;
            this.lastDragOverTarget = null;
            
            this.$el.on('dragstart.kanban-drag', '.kanban-card', (function(e) {
                const recordId = e.currentTarget.dataset.id;
                const currentStatus = e.currentTarget.dataset.status;
                
                e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                    recordId: recordId,
                    currentStatus: currentStatus,
                    sourceElement: $(e.currentTarget).index()
                }));
                
                $(e.currentTarget).addClass('dragging');
                this.draggedElement = $(e.currentTarget);
                
                // Prevent any hover effects during drag
                this.$el.addClass('is-dragging');
            }).bind(this));

            this.$el.on('dragend.kanban-drag', '.kanban-card', (function(e) {
                $(e.currentTarget).removeClass('dragging');
                this.$el.find('.drag-over, .drag-over-card').removeClass('drag-over drag-over-card');
                this.$el.removeClass('is-dragging');
                this.draggedElement = null;
                this.lastDragOverTarget = null;
            }).bind(this));
            
            // Optimized drag over for cards (throttled)
            this.$el.on('dragover.kanban-drag', '.kanban-card', (function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const currentTarget = $(e.currentTarget);
                
                if (this.draggedElement && !currentTarget.is(this.draggedElement)) {
                    // Only change if different from last target
                    if (this.lastDragOverTarget && !this.lastDragOverTarget.is(currentTarget)) {
                        this.lastDragOverTarget.removeClass('drag-over-card');
                    }
                    
                    currentTarget.addClass('drag-over-card');
                    this.lastDragOverTarget = currentTarget;
                }
            });

            this.$el.on('dragleave.kanban-drag', '.kanban-card', function(e) {
                const currentTarget = $(e.currentTarget);
                const relatedTarget = $(e.relatedTarget);
                
                // Only remove if not moving to a child element
                if (!currentTarget.has(relatedTarget).length && !currentTarget.is(relatedTarget)) {
                    currentTarget.removeClass('drag-over-card');
                }
            });
            
            // Optimized drag over columns (for status change)
            this.$el.on('dragover.kanban-drag', '.kanban-cards', function(e) {
                e.preventDefault();
                const currentTarget = $(e.currentTarget);
                if (!currentTarget.hasClass('drag-over')) {
                    currentTarget.addClass('drag-over');
                }
            });

            this.$el.on('dragleave.kanban-drag', '.kanban-cards', function(e) {
                const currentTarget = $(e.currentTarget);
                const relatedTarget = $(e.relatedTarget);
                
                if (!currentTarget.is(relatedTarget) && !currentTarget.has(relatedTarget).length) {
                    currentTarget.removeClass('drag-over');
                }
            });
            
            // Drop on card (reorder within same column)
            this.$el.on('drop.kanban-drag', '.kanban-card', (function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dropTarget = $(e.currentTarget);
                dropTarget.removeClass('drag-over-card');
                
                try {
                    const dragData = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
                    const targetStatus = dropTarget.data('status');
                    
                    // Only allow reordering within same status
                    if (dragData.currentStatus === targetStatus) {
                        const targetIndex = dropTarget.index();
                        this.reorderCard(dragData.recordId, targetStatus, targetIndex);
                    }
                } catch (error) {
                    console.error('Error parsing drag data:', error);
                }
            }).bind(this));
            
            // Drop on column (status change)
            this.$el.on('drop.kanban-drag', '.kanban-cards', (function(e) {
                e.preventDefault();
                $(e.currentTarget).removeClass('drag-over');
                
                try {
                    const dragData = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
                    const newStatus = e.currentTarget.dataset.status;
                    
                    if (dragData.currentStatus !== newStatus) {
                        // Status change
                        this.updateRecordStatus(dragData.recordId, newStatus);
                    } else {
                        // Same status - reorder to end
                        const targetIndex = $(e.currentTarget).find('.kanban-card').length;
                        this.reorderCard(dragData.recordId, newStatus, targetIndex);
                    }
                } catch (error) {
                    console.error('Error parsing drag data:', error);
                }
            }).bind(this));
        },

        setupCardActions: function() {
            this.$el.off('mouseenter.kanban mouseleave.kanban click.kanban');
            
            this.$el.on('mouseenter.kanban', '.kanban-card', function() {
                $(this).find('.card-actions').css('opacity', '1');
            });

            this.$el.on('mouseleave.kanban', '.kanban-card', function() {
                $(this).find('.card-actions').css('opacity', '0');
            });

            this.$el.on('click.kanban', '.view-record', (function(e) {
                e.preventDefault();
                e.stopPropagation();
                const recordId = $(e.currentTarget).data('id');
                this.getRouter().navigate('#' + this.entityType + '/view/' + recordId, {trigger: true});
            }).bind(this));
        },

        reorderCard: function(recordId, status, targetIndex) {
            // Get current cards in the status column
            const currentCards = this.$el.find(`.kanban-cards[data-status="${status}"] .kanban-card`);
            const cardIds = [];
            
            currentCards.each(function() {
                const id = $(this).data('id');
                if (id !== recordId) {
                    cardIds.push(id);
                }
            });
            
            // Insert the moved card at target position
            cardIds.splice(targetIndex, 0, recordId);
            
            // Update kanbanOrder for all cards in this status
            this.updateKanbanOrder(cardIds, status);
        },

        updateKanbanOrder: function(cardIds, status) {
            // Check if entity supports kanbanOrder field
            const entityDefs = this.getMetadata().get(['entityDefs', this.entityType]) || {};
            const hasKanbanOrder = entityDefs.fields && entityDefs.fields.kanbanOrder;
            
            if (!hasKanbanOrder) {
                console.log('Entity ' + this.entityType + ' does not support kanbanOrder field, skipping reorder');
                // Just refresh to show cards in original order
                this.loadKanbanData();
                return;
            }
            
            // Update individual records with new kanbanOrder
            const updatePromises = cardIds.map((id, index) => {
                const kanbanOrder = (index + 1) * 10; // Use increments of 10 for easier reordering
                
                return $.ajax({
                    url: 'api/v1/' + this.entityType + '/' + id,
                    type: 'PUT',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({ kanbanOrder: kanbanOrder })
                });
            });
            
            // Wait for all updates to complete
            $.when.apply($, updatePromises).done((function() {
                Espo.Ui.success('Pořadí aktualizováno');
                this.loadKanbanData();
            }).bind(this)).fail((function(error) {
                console.error('Error updating kanban order:', error);
                Espo.Ui.error(this.translate('Error occurred'));
                this.loadKanbanData(); // Refresh to show correct state
            }).bind(this));
        },

        updateRecordStatus: function(recordId, newStatus) {
            const data = {};
            data[this.statusField] = newStatus;
            
            $.ajax({
                url: 'api/v1/' + this.entityType + '/' + recordId,
                type: 'PUT',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(data)
            }).done((function() {
                Espo.Ui.success(this.translate('Updated'));
                this.loadKanbanData();
            }).bind(this)).fail((function(error) {
                console.error('Error updating record status:', error);
                Espo.Ui.error(this.translate('Error occurred'));
                this.loadKanbanData(); // Refresh to show correct state
            }).bind(this));
        },

        startAutoRefresh: function() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
            
            this.refreshTimer = setInterval((function() {
                this.loadKanbanData();
            }).bind(this), this.refreshInterval * 60 * 1000);
        },

        showErrorMessage: function() {
            const errorHtml = 
                '<div class="text-center text-danger" style="padding: 40px;">' +
                '<p><i class="fas fa-exclamation-triangle"></i></p>' +
                '<p>' + this.translate('Error occurred') + '</p>' +
                '<button class="btn btn-default kanban-retry-btn">' +
                this.translate('Try Again') + 
                '</button>' +
                '</div>';
                
            this.$el.find('.kanban-container').html(errorHtml);
            
            // Add event handler for retry button (CSP-safe)
            this.$el.find('.kanban-retry-btn').on('click', (function() {
                this.actionRefresh();
            }).bind(this));
        },

        showConfigurationError: function() {
            const entityName = this.entityType;
            const errorHtml = 
                '<div class="text-center text-warning" style="padding: 30px;">' +
                '<p><i class="fas fa-exclamation-circle" style="font-size: 32px; color: #f0ad4e;"></i></p>' +
                '<h4>Entity Configuration Issue</h4>' +
                '<p style="margin: 15px 0;">Entity <strong>' + entityName + '</strong> is not properly configured for Kanban view.</p>' +
                '<div style="text-align: left; max-width: 400px; margin: 20px auto; padding: 15px; background: #f5f5f5; border-radius: 4px;">' +
                '<p style="margin-bottom: 10px;"><strong>Required configuration:</strong></p>' +
                '<ul style="margin: 0; padding-left: 20px;">' +
                '<li>Entity must exist and be enabled</li>' +
                '<li>You must have read access to the entity</li>' +
                '<li>Entity needs at least one enum field for status</li>' +
                '</ul>' +
                '</div>' +
                '<p style="margin: 15px 0;">Please check:</p>' +
                '<div style="text-align: left; max-width: 400px; margin: 0 auto;">' +
                '<ol style="margin: 0; padding-left: 20px;">' +
                '<li>Administration → Entity Manager → ' + entityName + '</li>' +
                '<li>Check that entity has proper fields defined</li>' +
                '<li>Check your role permissions for this entity</li>' +
                '</ol>' +
                '</div>' +
                '<div style="margin-top: 20px;">' +
                '<button class="btn btn-default kanban-retry-btn" style="margin-right: 10px;">' +
                this.translate('Try Again') + 
                '</button>' +
                '<button class="btn btn-primary kanban-options-btn">' +
                'Change Entity' +
                '</button>' +
                '</div>' +
                '</div>';
                
            this.$el.find('.kanban-container').html(errorHtml);
            
            // Add event handlers
            this.$el.find('.kanban-retry-btn').on('click', (function() {
                this.actionRefresh();
            }).bind(this));
            
            this.$el.find('.kanban-options-btn').on('click', (function() {
                this.actionOptions();
            }).bind(this));
        },

        showAccessError: function() {
            const errorHtml = 
                '<div class="text-center text-danger" style="padding: 40px;">' +
                '<p><i class="fas fa-lock" style="font-size: 32px;"></i></p>' +
                '<h4>Access Denied</h4>' +
                '<p>You do not have permission to view <strong>' + this.entityType + '</strong> records.</p>' +
                '<p>Please contact your administrator.</p>' +
                '<button class="btn btn-primary kanban-options-btn" style="margin-top: 15px;">' +
                'Change Entity' +
                '</button>' +
                '</div>';
                
            this.$el.find('.kanban-container').html(errorHtml);
            
            this.$el.find('.kanban-options-btn').on('click', (function() {
                this.actionOptions();
            }).bind(this));
        },

        actionRefresh: function() {
            this.loadKanbanData();
        },

        actionOptions: function() {
            this.createView('options', 'custom:views/dashlets/options/universal-kanban', {
                name: this.name,
                optionsData: this.optionsData,
                fields: this.optionsFields || this.getOptionsFields()
            }, (view) => {
                view.render();
            });
        },

        getOptionsFields: function() {
            return {
                'title': {
                    'type': 'varchar',
                    'required': true
                },
                'entityType': {
                    'type': 'enum',
                    'required': true,
                    'options': this.getKanbanEntitiesList()
                },
                'statusField': {
                    'type': 'varchar',
                    'required': false,
                    'tooltip': 'Pole pro status (ponechte prázdné pro automatickou detekci)'
                },
                'autorefreshInterval': {
                    'type': 'enumFloat',
                    'options': [0, 0.5, 1, 2, 5, 10],
                    'default': 0
                },
                'maxRecords': {
                    'type': 'int',
                    'min': 10,
                    'max': 500,
                    'default': 100
                }
            };
        },

        onRemove: function() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
            this.$el.off('.kanban');
            this.$el.off('.kanban-drag');
            this.draggedElement = null;
            this.lastDragOverTarget = null;
            Dep.prototype.onRemove.call(this);
        },

        escapeHtml: function(text) {
            if (!text) return '';
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
        },

        loadCustomStyles: function() {
            if ($('#kanban-dashlet-styles').length === 0) {
                const styles = `
                <style id="kanban-dashlet-styles">
                .kanban-board {
                    min-height: 200px;
                    background: #f1f3f4;
                    border-radius: 4px;
                }
                .kanban-column {
                    min-height: 150px;
                    transition: all 0.2s ease;
                }
                .kanban-column:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
                }
                .kanban-header {
                    background: linear-gradient(135deg, #495057, #6c757d) !important;
                    border-bottom: 2px solid rgba(255,255,255,0.1);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                .kanban-cards {
                    background: #fafbfc;
                    border: 1px solid #e9ecef;
                    border-top: none;
                }
                .kanban-cards.drag-over {
                    background: #e3f2fd;
                    border-color: #2196f3;
                    box-shadow: inset 0 0 8px rgba(33, 150, 243, 0.3);
                }
                .kanban-card {
                    transition: all 0.2s ease !important;
                    border-left: 3px solid transparent !important;
                }
                .kanban-card:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                    border-left-color: #007bff !important;
                }
                .kanban-card.dragging {
                    opacity: 0.6;
                    transform: rotate(5deg) !important;
                    z-index: 1000;
                }
                .kanban-card .card-actions {
                    background: rgba(255,255,255,0.9);
                    border-radius: 2px;
                    padding: 2px;
                }
                .kanban-card .card-actions button {
                    border: none !important;
                    background: transparent !important;
                    color: #6c757d !important;
                    font-size: 12px !important;
                    padding: 2px 4px !important;
                    border-radius: 2px;
                }
                .kanban-card .card-actions button:hover {
                    background: #007bff !important;
                    color: white !important;
                }
                .kanban-cards::-webkit-scrollbar {
                    width: 6px;
                }
                .kanban-cards::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }
                .kanban-cards::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 3px;
                }
                .kanban-cards::-webkit-scrollbar-thumb:hover {
                    background: #a1a1a1;
                }
                .kanban-card[data-status*="completed"], 
                .kanban-card[data-status*="Completed"],
                .kanban-card[data-status*="approved"],
                .kanban-card[data-status*="Delivered"] {
                    border-left-color: #28a745 !important;
                }
                .kanban-card[data-status*="started"],
                .kanban-card[data-status*="Started"], 
                .kanban-card[data-status*="pending"],
                .kanban-card[data-status*="Confirmed"] {
                    border-left-color: #ffc107 !important;
                }
                .kanban-card[data-status*="cancelled"],
                .kanban-card[data-status*="Canceled"],
                .kanban-card[data-status*="rejected"],
                .kanban-card[data-status*="Rejected"] {
                    border-left-color: #dc3545 !important;
                }
                .kanban-card[data-status*="draft"],
                .kanban-card[data-status*="Draft"] {
                    border-left-color: #6c757d !important;
                }
                @media (max-width: 768px) {
                    .kanban-board {
                        flex-direction: column !important;
                        gap: 5px !important;
                        padding: 5px !important;
                    }
                    .kanban-column {
                        flex: none !important;
                        margin-right: 0 !important;
                        margin-bottom: 5px;
                    }
                    .kanban-cards {
                        max-height: 200px !important;
                    }
                }
                @keyframes cardSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .kanban-card {
                    animation: cardSlideIn 0.3s ease-out;
                }
                
                /* Drag & Drop Reordering Styles */
                .kanban-card.drag-over-card {
                    border-top: 3px solid #007bff !important;
                    margin-top: 3px !important;
                    transform: translateY(-1px);
                    box-shadow: 0 -2px 8px rgba(0, 123, 255, 0.3) !important;
                }
                
                .kanban-card.dragging {
                    opacity: 0.7 !important;
                    transform: rotate(3deg) scale(1.05) !important;
                    z-index: 1000 !important;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
                }
                
                .kanban-cards.drag-over::after {
                    content: "Sem přetáhni pro změnu statusu";
                    display: block;
                    text-align: center;
                    padding: 15px;
                    color: #007bff;
                    font-weight: bold;
                    font-size: 12px;
                    border: 2px dashed #007bff;
                    border-radius: 4px;
                    margin: 5px;
                    background: rgba(0, 123, 255, 0.05);
                }
                
                .kanban-card:hover {
                    cursor: grab !important;
                }
                
                .kanban-card:active {
                    cursor: grabbing !important;
                }
                
                /* Prevent hover effects during drag */
                .kanban-board.is-dragging .kanban-card:hover {
                    transform: none !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
                }
                
                .kanban-board.is-dragging .kanban-column:hover {
                    transform: none !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                }
                
                /* Visual indicator for droppable areas */
                .kanban-card.drag-over-card::before {
                    content: "⬆ Přetáhni sem pro změnu pořadí";
                    position: absolute;
                    top: -25px;
                    left: 0;
                    right: 0;
                    font-size: 10px;
                    color: #007bff;
                    text-align: center;
                    font-weight: bold;
                    background: rgba(255,255,255,0.9);
                    padding: 2px;
                    border-radius: 3px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    z-index: 100;
                }
                
                .kanban-column.drag-target {
                    background: rgba(0, 123, 255, 0.05) !important;
                    border: 2px dashed #007bff !important;
                }
                </style>
                `;
                $('head').append(styles);
            }
        }
    });
});