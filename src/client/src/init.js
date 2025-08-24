/**
 * VIA CRM Module Initialization
 * Simple initialization without eval or complex AMD patterns
 */

(function() {
    'use strict';
    
    console.log('VIA CRM Module: init.js loaded');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initViacrm);
    } else {
        initViacrm();
    }
    
    function initViacrm() {
        console.log('VIA CRM Module: Initializing...');
        
        // Add VIA CRM class to body
        document.body.classList.add('viacrm-loaded');
        
        // Add VIA CRM indicator
        addViaCrmIndicator();
        
        // Initialize view extensions
        initViewExtensions();
        
        // Load alert system
        loadAlertSystem();
        
        // Customize footer copyright
        customizeFooter();
        
        console.log('VIA CRM Module: Initialized successfully!');
    }
    
    function addViaCrmIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'viacrm-indicator';
        indicator.textContent = 'VIA';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 9999;
            opacity: 0.8;
        `;
        document.body.appendChild(indicator);
        
        console.log('VIA CRM Module: Indicator added');
    }
    
    function initViewExtensions() {
        // Simple view enhancement without eval
        // Use interval-based checking instead of MutationObserver if CSP issues persist
        let enhancementInterval = setInterval(function() {
            enhanceExistingElements();
        }, 2000);
        
        // Stop after 30 seconds to avoid infinite running
        setTimeout(function() {
            clearInterval(enhancementInterval);
            console.log('VIA CRM Module: Enhancement interval stopped');
        }, 30000);
        
        // Initial enhancement
        enhanceExistingElements();
        
        console.log('VIA CRM Module: View extensions initialized with interval-based enhancement');
    }
    
    function enhanceExistingElements() {
        // Enhance all existing elements on the page
        const body = document.body;
        if (body) {
            enhanceElement(body);
        }
    }
    
    function enhanceElement(element) {
        // Enhanced list views
        const listViews = element.querySelectorAll('.list-view, .list-container, [class*="list"]');
        listViews.forEach(view => {
            if (!view.classList.contains('viacrm-enhanced')) {
                view.classList.add('viacrm-list-view', 'viacrm-enhanced');
                console.log('VIA CRM: Enhanced list view');
            }
        });
        
        // Enhanced detail views  
        const detailViews = element.querySelectorAll('.detail-view, .detail-container, [class*="detail"]');
        detailViews.forEach(view => {
            if (!view.classList.contains('viacrm-enhanced')) {
                view.classList.add('viacrm-detail-view', 'viacrm-enhanced');
                console.log('VIA CRM: Enhanced detail view');
            }
        });
        
        // Enhanced edit views
        const editViews = element.querySelectorAll('.edit-view, .edit-container, [class*="edit"]');
        editViews.forEach(view => {
            if (!view.classList.contains('viacrm-enhanced')) {
                view.classList.add('viacrm-edit-view', 'viacrm-enhanced');
                console.log('VIA CRM: Enhanced edit view');
            }
        });
        
        // Enhance list headers
        const headers = element.querySelectorAll('th, .list-header');
        headers.forEach(header => {
            if (!header.classList.contains('viacrm-enhanced')) {
                header.classList.add('viacrm-list-header', 'viacrm-enhanced');
                console.log('VIA CRM: Enhanced list header');
            }
        });
        
        // Enhance list rows
        const rows = element.querySelectorAll('tbody tr, .list-row');
        rows.forEach(row => {
            if (!row.classList.contains('viacrm-enhanced')) {
                row.classList.add('viacrm-list-row', 'viacrm-enhanced');
                console.log('VIA CRM: Enhanced list row');
            }
        });
        
        // Enhance form fields
        const fields = element.querySelectorAll('.field, input, select, textarea');
        fields.forEach(field => {
            if (!field.classList.contains('viacrm-enhanced')) {
                field.classList.add('viacrm-field', 'viacrm-enhanced');
                if (fields.length <= 10) { // Only log if not too many fields
                    console.log('VIA CRM: Enhanced field');
                }
            }
        });
    }
    
    function loadAlertSystem() {
        // Alert system is loaded via metadata, just check if it exists
        if (window.ViaCrmAlertSystem) {
            console.log('VIA CRM: Alert system already loaded');
        } else {
            console.log('VIA CRM: Waiting for alert system to load...');
            // Wait a bit for the script to load via metadata
            setTimeout(() => {
                if (window.ViaCrmAlertSystem) {
                    console.log('VIA CRM: Alert system loaded successfully');
                } else {
                    console.warn('VIA CRM: Alert system not available');
                }
            }, 1000);
        }
    }
    
    function customizeFooter() {
        // Function to replace EspoCRM copyright with viaCRM
        function replaceFooterText() {
            // Target the specific footer structure we found
            const footer = document.querySelector('footer');
            if (footer) {
                const creditParagraph = footer.querySelector('p.credit.small');
                if (creditParagraph) {
                    // Replace the entire content
                    creditParagraph.innerHTML = '@2025 ViaCRM';
                    console.log('VIA CRM: Footer copyright text replaced');
                }
                
                // Also target the EspoCRM link specifically
                const espoLink = footer.querySelector('a[title*="EspoCRM"]');
                if (espoLink) {
                    espoLink.textContent = 'viaCRM';
                    espoLink.href = '#';
                    espoLink.title = 'Powered by viaCRM';
                    console.log('VIA CRM: Footer link updated');
                }
            }
        }
        
        // Run immediately
        replaceFooterText();
        
        // Run periodically to catch any dynamic updates
        setInterval(replaceFooterText, 5000);
        
        // Also run on DOM changes
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(function(mutations) {
                let shouldCheck = false;
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.target.tagName === 'BODY') {
                        shouldCheck = true;
                    }
                });
                if (shouldCheck) {
                    setTimeout(replaceFooterText, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: false
            });
        }
        
        console.log('VIA CRM: Footer customization initialized');
    }
    
})();