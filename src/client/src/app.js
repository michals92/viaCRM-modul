// ViaCRM Module Client Extension
// Main app entry point
(function() {
    'use strict';
    
    console.log('ViaCRM app.js loaded');
    
    // Extend ViaCRM namespace with app functionality
    if (typeof window.ViaCRM !== 'undefined') {
        window.ViaCRM.app = {
            initialized: false,
            
            init: function() {
                if (this.initialized) return;
                
                console.log('ViaCRM app initialized');
                this.initialized = true;
                
                // Any additional app initialization
                this.setupGlobalExtensions();
            },
            
            setupGlobalExtensions: function() {
                // Setup any global app extensions
                if (typeof window.Espo !== 'undefined') {
                    console.log('ViaCRM app extensions ready');
                }
            }
        };
        
        // Auto-initialize
        window.ViaCRM.app.init();
    }
})();