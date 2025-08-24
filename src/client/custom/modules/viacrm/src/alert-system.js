/**
 * VIA CRM Alert System
 * Manages user alerts and notifications
 */

(function() {
    'use strict';
    
    window.ViaCrmAlertSystem = {
        initialized: false,
        alerts: [],
        checkInterval: null,
        
        init: function() {
            if (this.initialized) return;
            
            console.log('VIA CRM: Initializing Alert System');
            this.initialized = true;
            
            // Add alert container to DOM
            this.createAlertContainer();
            
            // Load initial alerts
            this.loadUserAlerts();
            
            // Set up periodic checking
            this.startPeriodicCheck();
            
            // Add alert CSS
            this.addAlertStyles();
        },
        
        createAlertContainer: function() {
            if (document.querySelector('#viacrm-alerts')) return;
            
            const container = document.createElement('div');
            container.id = 'viacrm-alerts';
            container.className = 'viacrm-alert-container';
            
            document.body.appendChild(container);
            
            console.log('VIA CRM: Alert container created');
        },
        
        addAlertStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                .viacrm-alert-container {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 350px;
                    z-index: 1060;
                    pointer-events: none;
                }
                
                .viacrm-alert {
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    pointer-events: auto;
                    animation: slideInRight 0.3s ease-out;
                    max-width: 100%;
                    word-wrap: break-word;
                }
                
                .viacrm-alert.alert-info {
                    border-left: 4px solid #17a2b8;
                }
                
                .viacrm-alert.alert-success {
                    border-left: 4px solid #28a745;
                }
                
                .viacrm-alert.alert-warning {
                    border-left: 4px solid #ffc107;
                }
                
                .viacrm-alert.alert-danger {
                    border-left: 4px solid #dc3545;
                }
                
                .viacrm-alert.alert-primary {
                    border-left: 4px solid #007bff;
                }
                
                .viacrm-alert-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 15px 8px;
                    border-bottom: 1px solid #f1f1f1;
                }
                
                .viacrm-alert-title {
                    font-weight: 600;
                    font-size: 14px;
                    margin: 0;
                    display: flex;
                    align-items: center;
                }
                
                .viacrm-alert-icon {
                    margin-right: 8px;
                    font-size: 16px;
                }
                
                .viacrm-alert-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    color: #aaa;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }
                
                .viacrm-alert-close:hover {
                    color: #666;
                }
                
                .viacrm-alert-body {
                    padding: 8px 15px 12px;
                }
                
                .viacrm-alert-description {
                    font-size: 13px;
                    line-height: 1.4;
                    color: #666;
                    margin: 0;
                }
                
                .viacrm-alert-actions {
                    padding: 8px 15px 12px;
                    border-top: 1px solid #f1f1f1;
                    text-align: right;
                }
                
                .viacrm-alert-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                }
                
                .viacrm-alert-btn:hover {
                    background: #0056b3;
                    color: white;
                    text-decoration: none;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            console.log('VIA CRM: Alert styles added');
        },
        
        loadUserAlerts: function() {
            console.log('VIA CRM: Loading user alerts...');
            
            // Use native fetch with proper authentication
            fetch('/api/v1/ViaCrm/Alert/userAlerts', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(response => {
                if (response.error) {
                    throw new Error(response.error);
                }
                
                this.alerts = response.list || [];
                this.displayAlerts();
                
                console.log(`VIA CRM: Loaded ${this.alerts.length} alerts`);
            })
            .catch(error => {
                console.error('VIA CRM: Failed to load alerts:', error);
                this.showErrorNotification('Failed to load alerts: ' + error.message);
            });
        },
        
        displayAlerts: function() {
            console.log('VIA CRM: displayAlerts() called with', this.alerts.length, 'alerts');
            const container = document.querySelector('#viacrm-alerts');
            if (!container) {
                console.error('VIA CRM: Alert container not found!');
                return;
            }
            
            console.log('VIA CRM: Alert container found:', container);
            
            // Clear existing alerts
            container.innerHTML = '';
            console.log('VIA CRM: Container cleared, displaying alerts...');
            
            // Display each alert
            this.alerts.forEach((alert, index) => {
                console.log('VIA CRM: Displaying alert', index + 1, ':', alert);
                this.displayAlert(alert, container);
            });
            
            console.log('VIA CRM: All alerts displayed');
        },
        
        displayAlert: function(alert, container) {
            const alertElement = document.createElement('div');
            alertElement.className = `viacrm-alert alert-${alert.type.toLowerCase()}`;
            alertElement.dataset.alertId = alert.id;
            
            const iconClass = alert.iconClass || this.getDefaultIcon(alert.type);
            const hasActions = alert.url || alert.isClosable;
            
            alertElement.innerHTML = `
                <div class="viacrm-alert-header">
                    <h5 class="viacrm-alert-title">
                        <i class="${iconClass} viacrm-alert-icon" style="color: ${alert.color || this.getDefaultColor(alert.type)};"></i>
                        ${alert.name}
                    </h5>
                    ${alert.isClosable ? '<button class="viacrm-alert-close" data-action="close">&times;</button>' : ''}
                </div>
                
                ${alert.description ? `
                    <div class="viacrm-alert-body">
                        <p class="viacrm-alert-description">${alert.description}</p>
                    </div>
                ` : ''}
                
                ${hasActions ? `
                    <div class="viacrm-alert-actions">
                        ${alert.url ? `<a href="${alert.url}" class="viacrm-alert-btn" data-action="view">View</a>` : ''}
                    </div>
                ` : ''}
            `;
            
            // Add event listeners
            if (alert.isClosable) {
                const closeBtn = alertElement.querySelector('[data-action="close"]');
                closeBtn.addEventListener('click', () => {
                    this.closeAlert(alert.id, alertElement);
                });
            }
            
            if (alert.url) {
                const viewBtn = alertElement.querySelector('[data-action="view"]');
                if (viewBtn) {
                    viewBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.markViewed(alert.id);
                        window.location.hash = alert.url;
                    });
                }
            }
            
            // Auto-close if specified
            if (alert.autoCloseAfter && alert.autoCloseAfter > 0) {
                setTimeout(() => {
                    if (alertElement.parentNode) {
                        this.closeAlert(alert.id, alertElement);
                    }
                }, alert.autoCloseAfter * 1000);
            }
            
            container.appendChild(alertElement);
        },
        
        closeAlert: function(alertId, alertElement) {
            // Animate out
            alertElement.style.animation = 'slideOutRight 0.3s ease-in';
            
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
                
                // Remove from alerts array
                this.alerts = this.alerts.filter(alert => alert.id !== alertId);
            }, 300);
            
            // Notify backend
            fetch('/api/v1/ViaCrm/Alert/close', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ alertId: alertId })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(response => {
                if (!response.success) {
                    throw new Error('Failed to close alert on server');
                }
                console.log('VIA CRM: Alert closed successfully');
            })
            .catch(error => {
                console.error('VIA CRM: Failed to close alert:', error);
                this.showErrorNotification('Failed to close alert: ' + error.message);
            });
        },
        
        markViewed: function(alertId) {
            fetch('/api/v1/ViaCrm/Alert/markViewed', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ alertId: alertId })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(response => {
                if (!response.success) {
                    throw new Error('Failed to mark alert as viewed on server');
                }
                console.log('VIA CRM: Alert marked as viewed');
            })
            .catch(error => {
                console.error('VIA CRM: Failed to mark alert as viewed:', error);
            });
        },
        
        startPeriodicCheck: function() {
            // Check for new alerts every 60 seconds
            this.checkInterval = setInterval(() => {
                console.log('VIA CRM: Periodic alert check...');
                this.loadUserAlerts();
            }, 60 * 1000);
        },
        
        showErrorNotification: function(message) {
            // Create a temporary error notification
            const errorDiv = document.createElement('div');
            errorDiv.className = 'viacrm-alert alert-danger';
            errorDiv.innerHTML = `
                <div class="viacrm-alert-header">
                    <h5 class="viacrm-alert-title">
                        <i class="fas fa-exclamation-triangle viacrm-alert-icon" style="color: #dc3545;"></i>
                        Error
                    </h5>
                    <button class="viacrm-alert-close" onclick="this.parentNode.parentNode.remove()">&times;</button>
                </div>
                <div class="viacrm-alert-body">
                    <p class="viacrm-alert-description">${message}</p>
                </div>
            `;
            
            const container = document.querySelector('#viacrm-alerts');
            if (container) {
                container.appendChild(errorDiv);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 5000);
            }
        },
        
        getDefaultIcon: function(type) {
            const icons = {
                'Info': 'fas fa-info-circle',
                'Success': 'fas fa-check-circle',
                'Warning': 'fas fa-exclamation-triangle',
                'Danger': 'fas fa-times-circle',
                'Primary': 'fas fa-bell'
            };
            return icons[type] || 'fas fa-info-circle';
        },
        
        getDefaultColor: function(type) {
            const colors = {
                'Info': '#17a2b8',
                'Success': '#28a745',
                'Warning': '#ffc107',
                'Danger': '#dc3545',
                'Primary': '#007bff'
            };
            return colors[type] || '#17a2b8';
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.ViaCrmAlertSystem.init();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            window.ViaCrmAlertSystem.init();
        }, 2000);
    }
    
})();