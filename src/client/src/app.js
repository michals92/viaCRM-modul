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
                    this.setupRoutes();
                }
            },
            
            setupRoutes: function() {
                // Register routes using EspoCRM's proper mechanism
                if (window.Espo && window.Espo.loader) {
                    // Wait for the app to be ready
                    const registerRoutes = () => {
                        if (window.app && window.app.router) {
                            console.log('🚀 Registering Legendary Email Editor routes...');
                            
                            // Define routes for legendary editor
                            const routes = {
                                'EmailTemplate/edit/:id/legendary': function(id) {
                                    console.log('🚀 Route matched: EmailTemplate/edit/' + id + '/legendary');
                                    this.main('viacrm:views/email-template/legendary-editor', {
                                        templateId: id
                                    });
                                }.bind(window.app),
                                
                                'EmailTemplate/create/legendary': function() {
                                    console.log('🚀 Route matched: EmailTemplate/create/legendary');
                                    this.main('viacrm:views/email-template/legendary-editor', {
                                        templateId: 'new'
                                    });
                                }.bind(window.app)
                            };
                            
                            // Add each route to the router
                            for (const route in routes) {
                                window.app.router.route(route, 'legendary_' + route.replace(/[^a-zA-Z0-9]/g, '_'), routes[route]);
                            }
                            
                            console.log('🚀 Legendary Email Editor routes registered successfully');
                            
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