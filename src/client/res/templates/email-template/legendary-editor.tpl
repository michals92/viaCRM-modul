<div class="legendary-fullpage-editor">
    <iframe id="legendary-editor-iframe" 
            frameborder="0" 
            style="width: 100%; height: 100vh; border: none; display: block;">
    </iframe>
</div>

<style>
.legendary-fullpage-editor {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10000;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Hide EspoCRM navigation and other elements when in full editor mode */
body.has-legendary-editor .navbar,
body.has-legendary-editor .page-header,
body.has-legendary-editor #content > .container,
body.has-legendary-editor .breadcrumb {
    display: none !important;
}

body.has-legendary-editor {
    overflow: hidden !important;
    padding: 0 !important;
    margin: 0 !important;
}

body.has-legendary-editor #content {
    padding: 0 !important;
    margin: 0 !important;
}
</style>

<script>
// Add body class when editor loads
document.body.classList.add('has-legendary-editor');

// Remove body class when leaving
window.addEventListener('beforeunload', function() {
    document.body.classList.remove('has-legendary-editor');
});
</script>