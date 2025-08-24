// ViaCRM Alert System
(function() {
    'use strict';
    
    const AlertSystem = {
        initialized: false,
        
        init: function() {
            if (this.initialized) return;
            
            console.log('ViaCRM Alert System initialized');
            this.initialized = true;
            
            // Wait for App to be ready
            this.waitForApp();
        },
        
        waitForApp: function() {
            const checkApp = () => {
                if (typeof window.App !== 'undefined' && window.App.getUser && window.App.getUser().isLoggedIn()) {
                    this.setupAlertChecking();
                } else {
                    setTimeout(checkApp, 1000); // Check again in 1 second
                }
            };
            checkApp();
        },
        
        setupAlertChecking: function() {
            console.log('Setting up alert checking...');
            
            // Check for alerts periodically
            this.alertInterval = setInterval(() => {
                this.checkForAlerts();
            }, 60000); // Check every minute
            
            // Initial check after app is fully loaded
            setTimeout(() => {
                this.checkForAlerts();
            }, 10000); // Initial check after 10 seconds
        },
        
        checkForAlerts: function() {
            // Simple alert checking implementation
            if (typeof window.App === 'undefined' || !window.App.getUser || !window.App.getUser().isLoggedIn()) {
                return;
            }
            
            console.log('Checking for active alerts...');
            
            // This would make an API call to fetch active alerts
            // For now, just a placeholder that could be expanded
            
            // Example: this.fetchActiveAlerts();
        },
        
        fetchActiveAlerts: function() {
            // Future implementation for API calls
            if (typeof window.Espo !== 'undefined' && window.Espo.Ajax) {
                window.Espo.Ajax.getRequest('ViaCrm/Alert/userAlerts')
                    .then(response => {
                        if (response && response.list && response.list.length > 0) {
                            response.list.forEach(alert => {
                                this.showAlert(alert);
                            });
                        }
                    })
                    .catch(error => {
                        console.warn('Failed to fetch alerts:', error);
                    });
            }
        },
        
        showAlert: function(alertData) {
            if (typeof window.Espo !== 'undefined' && window.Espo.Ui && window.Espo.Ui.notify) {
                window.Espo.Ui.notify(alertData.message || alertData.name || 'Alert notification', alertData.type || 'info');
            }
        },
        
        destroy: function() {
            if (this.alertInterval) {
                clearInterval(this.alertInterval);
                this.alertInterval = null;
            }
        }
    };
    
    // Add to global ViaCRM namespace
    if (typeof window.ViaCRM !== 'undefined') {
        window.ViaCRM.AlertSystem = AlertSystem;
    }
    
    // Auto-initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            AlertSystem.init();
        });
    } else {
        AlertSystem.init();
    }
})();