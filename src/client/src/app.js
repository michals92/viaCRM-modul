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
            
            setupRoutes: function() {
                // Register routes using EspoCRM's proper mechanism
                if (window.Espo && window.Espo.loader) {
                    // Wait for the app to be ready
                    const registerRoutes = () => {
                        if (window.app && window.app.router) {
                            
                            // Define routes for legendary editor
                            const routes = {
                                'EmailTemplate/edit/:id/legendary': function(id) {
                                    this.main('viacrm:views/email-template/legendary-editor', {
                                        templateId: id
                                    });
                                }.bind(window.app),
                                
                                'EmailTemplate/create/legendary': function() {
                                    this.main('viacrm:views/email-template/legendary-editor', {
                                        templateId: 'new'
                                    });
                                }.bind(window.app)
                            };
                            
                            // Add each route to the router
                            for (const route in routes) {
                                window.app.router.route(route, 'legendary_' + route.replace(/[^a-zA-Z0-9]/g, '_'), routes[route]);
                            }  
                        } else {
                            setTimeout(registerRoutes, 100);
                        }
                    };
                    
                    // Wait for everything to be ready
                    if (document.readyState === 'complete') {
                        setTimeout(registerRoutes, 1000);
                    } else {
                        window.addEventListener('load', () => {
                            setTimeout(registerRoutes, 1000);
                        });
                    }
                }
            }
        };
        
        // Auto-initialize
        window.ViaCRM.app.init();
    }
})();