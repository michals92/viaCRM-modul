// ViaCRM Module Client Extension
// Main app entry point
(function() {
    'use strict';
    
    // Extend ViaCRM namespace with app functionality
    if (typeof window.ViaCRM !== 'undefined') {
        window.ViaCRM.app = {
            initialized: false,
            
            init: function() {
                if (this.initialized) return;

                this.initialized = true;
                
                // Any additional app initialization
                this.setupGlobalExtensions();
            },
            
            setupGlobalExtensions: function() {
                // Setup any global app extensions
                if (typeof window.Espo !== 'undefined') {
                    this.setupRoutes();
                    this.customizeFooter();
                }
            },
            
            customizeFooter: function() {
                // Replace EspoCRM footer with ViaCRM branding
                const replaceFooter = () => {
                    const footer = document.getElementById('footer');
                    if (footer) {
                        const creditElement = footer.querySelector('p.credit.small');
                        if (creditElement) {
                            creditElement.innerHTML = '© 2025 ViaCRM';
                        }
                    } else {
                        // Retry if footer not found yet
                        setTimeout(replaceFooter, 500);
                    }
                };
                
                // Wait for DOM to be ready
                if (document.readyState === 'complete') {
                    setTimeout(replaceFooter, 100);
                } else {
                    window.addEventListener('load', () => {
                        setTimeout(replaceFooter, 100);
                    });
                }
                
                // Also watch for dynamic content changes
                if (typeof MutationObserver !== 'undefined' && document.body) {
                    const observer = new MutationObserver(() => {
                        replaceFooter();
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            },
            
            setupRoutes: function() {}
        };
        
        // Auto-initialize
        window.ViaCRM.app.init();
    }
})();
