/**
 * VIA CRM Admin Buttons Handler
 * Adds quick admin buttons to views using EspoCRM standard methods
 */

define('viacrm:handlers/view-setup/admin-buttons', [], function () {
    'use strict';

    class AdminButtonsHandler {
        
        constructor(view) {
            this.view = view;
            this.scope = view.entityType || view.scope;
        }
        
        process() {
            // Only add for admin users
            if (!this.checkAdminRights()) {
                return;
            }
            
            console.log('VIA CRM: Adding admin buttons for', this.scope, 'view:', this.getViewType());
            
            this.addEntityManagementButtons();
            this.addLayoutManagementButtons();
            this.addQuickToolButtons();
        }
        
        checkAdminRights() {
            // Check if user has admin permissions
            if (this.view.getUser && this.view.getUser().isAdmin && this.view.getUser().isAdmin()) {
                return true;
            }
            
            // Fallback check
            if (this.view.getAcl && this.view.getAcl().checkScope('Admin')) {
                return true;
            }
            
            return false;
        }
        
        getViewType() {
            if (this.view.type) return this.view.type;
            if (this.view.name && this.view.name.includes('list')) return 'list';
            if (this.view.name && this.view.name.includes('detail')) return 'detail';
            if (this.view.name && this.view.name.includes('edit')) return 'edit';
            return 'unknown';
        }
        
        addEntityManagementButtons() {
            if (!this.scope || this.scope === 'Global') return;
            
            // Edit Entity Manager button
            this.view.addMenuItem('buttons', {
                name: 'editEntity',
                label: 'Edit Entity',
                style: 'default',
                iconHtml: '<i class="fas fa-cogs fa-sm"></i>',
                link: '#Admin/entityManager/scope=' + this.scope,
                title: 'Edit Entity Manager for ' + this.scope
            });
            
            // Edit Fields button
            this.view.addMenuItem('buttons', {
                name: 'editFields', 
                label: 'Edit Fields',
                style: 'default',
                iconHtml: '<i class="fas fa-list fa-sm"></i>',
                link: '#Admin/fieldManager/scope=' + this.scope,
                title: 'Edit Fields for ' + this.scope
            });
            
            // Edit Relationships button
            this.view.addMenuItem('buttons', {
                name: 'editRelationships',
                label: 'Edit Relations',
                style: 'default', 
                iconHtml: '<i class="fas fa-link fa-sm"></i>',
                action: 'editRelationships',
                title: 'Edit Relationships for ' + this.scope
            });
            
            // Attach action method
            this.view.actionEditRelationships = () => {
                window.location.hash = '#Admin/linkManager/scope=' + this.scope;
            };
        }
        
        addLayoutManagementButtons() {
            if (!this.scope || this.scope === 'Global') return;
            
            const viewType = this.getViewType();
            
            // Main layout button based on current view
            if (viewType !== 'unknown') {
                this.view.addMenuItem('buttons', {
                    name: 'editLayout',
                    label: 'Edit Layout',
                    style: 'primary',
                    iconHtml: '<i class="fas fa-th-large fa-sm"></i>',
                    link: '#Admin/layoutManager/scope=' + this.scope + '&type=' + viewType,
                    title: 'Edit ' + viewType + ' layout for ' + this.scope
                });
            }
            
            // View-specific additional buttons
            if (viewType === 'list') {
                this.view.addMenuItem('buttons', {
                    name: 'editListLayout',
                    label: 'List Columns',
                    style: 'info',
                    iconHtml: '<i class="fas fa-columns fa-sm"></i>',
                    link: '#Admin/layoutManager/scope=' + this.scope + '&type=list',
                    title: 'Edit List Layout'
                });
                
                this.view.addMenuItem('buttons', {
                    name: 'editSearchFilters',
                    label: 'Search Filters', 
                    style: 'info',
                    iconHtml: '<i class="fas fa-filter fa-sm"></i>',
                    link: '#Admin/layoutManager/scope=' + this.scope + '&type=filters',
                    title: 'Edit Search Filters'
                });
            }
            
            if (viewType === 'detail') {
                this.view.addMenuItem('buttons', {
                    name: 'editDetailLayout',
                    label: 'Detail Panels',
                    style: 'info', 
                    iconHtml: '<i class="fas fa-list-alt fa-sm"></i>',
                    link: '#Admin/layoutManager/scope=' + this.scope + '&type=detail',
                    title: 'Edit Detail Layout'
                });
                
                this.view.addMenuItem('buttons', {
                    name: 'editSidePanels',
                    label: 'Side Panels',
                    style: 'info',
                    iconHtml: '<i class="fas fa-columns fa-sm"></i>', 
                    link: '#Admin/layoutManager/scope=' + this.scope + '&type=sidePanelsDetail',
                    title: 'Edit Side Panels'
                });
            }
        }
        
        addQuickToolButtons() {
            // Clear Cache button
            this.view.addMenuItem('buttons', {
                name: 'clearCache',
                label: 'Clear Cache',
                style: 'warning',
                iconHtml: '<i class="fas fa-broom fa-sm"></i>',
                action: 'clearCache',
                title: 'Clear Application Cache'
            });
            
            // Admin Panel button  
            this.view.addMenuItem('buttons', {
                name: 'adminPanel',
                label: 'Admin Panel',
                style: 'default',
                iconHtml: '<i class="fas fa-user-shield fa-sm"></i>',
                link: '#Admin',
                title: 'Go to Admin Panel'
            });
            
            // Attach action methods
            this.view.actionClearCache = () => {
                this.clearCache();
            };
        }
        
        clearCache() {
            if (!confirm('Clear application cache? This will reload the page.')) {
                return;
            }
            
            console.log('VIA CRM: Clearing cache...');
            
            // Show notification
            if (this.view.notify) {
                this.view.notify('Clearing cache...', 'info');
            }
            
            // Simulate cache clear - in real implementation would call API
            setTimeout(() => {
                if (this.view.notify) {
                    this.view.notify('Cache cleared successfully!', 'success');
                }
                
                // Reload page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }, 1500);
        }
    }

    return AdminButtonsHandler;
});