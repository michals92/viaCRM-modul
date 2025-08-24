// ViaCRM Module Initialization
(function() {
    'use strict';
    
    // Initialize ViaCRM namespace
    if (typeof window.ViaCRM === 'undefined') {
        window.ViaCRM = {};
    }
    
    // Set up module info
    window.ViaCRM.version = '2.3.7';
    window.ViaCRM.initialized = true;
    
    console.log('ViaCRM Module initialized v' + window.ViaCRM.version);
    console.log('ViaCRM: Available at window.ViaCRM =', window.ViaCRM);
    
    // Setup extensions when Espo is ready
    function setupExtensions() {
        if (typeof Espo !== 'undefined' && Espo.loader) {
            // Register ViaCRM namespace for module loading
            if (typeof Espo.loader.setModulePathHelper === 'function') {
                Espo.loader.setModulePathHelper('viacrm', 'client/modules/viacrm/src');
            }
        }
    }
    
    // Initialize when DOM is ready or immediately if already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupExtensions);
    } else {
        setupExtensions();
    }
    
    // Also setup when Espo becomes available
    if (typeof window.Espo === 'undefined') {
        Object.defineProperty(window, 'Espo', {
            set: function(value) {
                this._espo = value;
                setupExtensions();
            },
            get: function() {
                return this._espo;
            },
            configurable: true
        });
    }
})();