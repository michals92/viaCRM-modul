/**
 * Related Panel View for VIA CRM
 * Displays related records in detail view bottom panels
 */

define('viacrm:views/record/panels/related-panel', ['views/record/panels/relationship'], function (Dep) {
    
    return Dep.extend({
        
        template: 'viacrm:record/panels/related-panel',
        
        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Get VIA CRM panel configuration
            this.viaCrmConfig = this.options.viaCrmConfig || {};
            
            // Setup panel features
            this.setupViaCrmPanelFeatures();
            
            console.log('VIA CRM Related Panel loaded for:', this.link);
        },
        
        /**
         * Setup VIA CRM specific panel features
         */
        setupViaCrmPanelFeatures: function () {
            // Enhanced title with icon
            if (this.viaCrmConfig.icon) {
                this.panelIcon = this.viaCrmConfig.icon;
            }
            
            // Custom layout for panel
            if (this.viaCrmConfig.layout) {
                this.listLayout = this.viaCrmConfig.layout;
            }
            
            // Enable quick create if configured
            if (this.viaCrmConfig.quickCreate) {
                this.buttonList.unshift({
                    action: 'createRelated',
                    label: 'Create',
                    acl: 'create',
                    aclScope: this.scope,
                    html: '<span class="fas fa-plus"></span> Quick Create'
                });
            }
            
            // Enable bulk actions if configured
            if (this.viaCrmConfig.bulkActions) {
                this.buttonList.push({
                    action: 'selectRelated',
                    label: 'Select Multiple',
                    html: '<span class="fas fa-check-square"></span> Bulk Select'
                });
            }
        },
        
        data: function () {
            const data = Dep.prototype.data.call(this);
            
            // Add VIA CRM specific data
            data.viaCrmConfig = this.viaCrmConfig;
            data.panelIcon = this.panelIcon;
            data.enhancedTitle = this.getEnhancedTitle();
            
            return data;
        },
        
        /**
         * Get enhanced panel title with icon and info
         */
        getEnhancedTitle: function () {
            let title = this.title || this.link;
            
            if (this.panelIcon) {
                title = `${this.panelIcon} ${title}`;
            }
            
            // Add record count if available
            if (this.collection && this.collection.length !== undefined) {
                title += ` (${this.collection.length})`;
            }
            
            return title;
        },
        
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            // Add VIA CRM specific enhancements
            this.addViaCrmEnhancements();
        },
        
        /**
         * Add VIA CRM specific enhancements to the panel
         */
        addViaCrmEnhancements: function () {
            // Add CSS class for styling
            if (this.$el) {
                this.$el.addClass('viacrm-related-panel');
                
                if (this.viaCrmConfig.customClass) {
                    this.$el.addClass(this.viaCrmConfig.customClass);
                }
            }
            
            // Setup enhanced interactions
            this.setupEnhancedInteractions();
        },
        
        /**
         * Setup enhanced interactions
         */
        setupEnhancedInteractions: function () {
            // Enhanced hover effects for rows
            this.$el.find('.list-row').hover(
                function() {
                    $(this).addClass('viacrm-row-hover');
                },
                function() {
                    $(this).removeClass('viacrm-row-hover');
                }
            );
            
            // Quick preview on row click
            if (this.viaCrmConfig.quickPreview) {
                this.setupQuickPreview();
            }
        },
        
        /**
         * Setup quick preview functionality
         */
        setupQuickPreview: function () {
            this.$el.on('click', '.list-row[data-id]', (e) => {
                if ($(e.target).closest('a, button').length) {
                    return; // Don't interfere with existing links/buttons
                }
                
                const id = $(e.currentTarget).data('id');
                
                if (id) {
                    this.showQuickPreview(id);
                }
            });
        },
        
        /**
         * Show quick preview modal
         */
        showQuickPreview: function (id) {
            this.createView('quickPreview', 'views/modals/detail', {
                scope: this.scope,
                id: id,
                model: this.collection.get(id)
            }, (view) => {
                view.render();
            });
        },
        
        /**
         * Action: Create related record with enhanced UI
         */
        actionCreateRelated: function () {
            // Enhanced create modal
            this.notify('Loading...');
            
            this.createView('quickCreate', 'views/modals/edit', {
                scope: this.scope,
                relate: {
                    model: this.model,
                    link: this.link
                }
            }, (view) => {
                view.render();
                this.notify(false);
                
                view.once('after:save', () => {
                    this.actionRefresh();
                });
            });
        },
        
        /**
         * Action: Select multiple related records
         */
        actionSelectRelated: function () {
            // Bulk selection modal
            this.createView('selectModal', 'views/modals/select-records', {
                scope: this.scope,
                multiple: true,
                primaryFilterName: this.defs.selectPrimaryFilterName || null
            }, (view) => {
                view.render();
                
                view.once('select', (models) => {
                    this.notify('Linking...');
                    
                    const promises = models.map(model => {
                        return new Promise((resolve) => {
                            $.ajax({
                                url: `${this.scope}/${model.id}/${this.link}`,
                                type: 'POST',
                                data: JSON.stringify({
                                    id: this.model.id
                                })
                            }).always(resolve);
                        });
                    });
                    
                    Promise.all(promises).then(() => {
                        this.notify('Linked', 'success');
                        this.actionRefresh();
                    });
                });
            });
        }
        
    });
});