define('viacrm:routes', [], function () {
    return {
        'EmailTemplate/edit/:id/legendary': 'viacrm:controllers/legendary-email-editor',
        'EmailTemplate/create/legendary': 'viacrm:controllers/legendary-email-editor'
    };
});