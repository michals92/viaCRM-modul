/**
 * VIA CRM Module - Main application file
 */

define('viacrm:app', [], function () {
    
    console.log('VIA CRM Module app.js loaded');
    
    // Load view extensions system
    require(['viacrm:extensions/view-helper', 'viacrm:extensions/controller'], function() {
        console.log('VIA CRM Extensions loaded successfully');
    });
    
    return true;
});