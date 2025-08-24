#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Testing ViaCRM Module Structure...\n');

// Check for restored functionality
const functionalityFiles = [
    'src/client/src/handlers/view-setup/admin-buttons.js',
    'src/backend/Resources/html/main.tpl',
    'src/client/src/init.js',
    'src/client/src/alert-system.js',
    'src/client/src/views/alert/detail.js',
    'src/client/src/views/alert/list.js',
    'src/client/src/views/record-template/detail.js',
    'src/client/src/views/record-template/list.js'
];

console.log('Checking restored functionality files:');
functionalityFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`✓ ${file}`);
    } else {
        console.log(`✗ MISSING: ${file}`);
        allPassed = false;
    }
});

console.log();

// Test essential files exist
const requiredFiles = [
    'src/backend/Resources/module.json',
    'src/backend/Resources/autoload.json', 
    'src/backend/Resources/routes.json',
    'src/backend/Controllers/Alert.php',
    'src/backend/Controllers/RecordTemplate.php',
    'src/backend/Entities/Alert.php',
    'src/backend/Entities/RecordTemplate.php',
    'src/client/src/app.js'
];

let allPassed = true;

requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`✓ ${file}`);
    } else {
        console.log(`✗ MISSING: ${file}`);
        allPassed = false;
    }
});

// Test module.json content
try {
    const moduleJson = JSON.parse(fs.readFileSync('src/backend/Resources/module.json', 'utf8'));
    console.log(`✓ Module name: ${moduleJson.name}`);
    console.log(`✓ Module version: ${moduleJson.version}`);
    console.log(`✓ Module order: ${moduleJson.order}`);
} catch (err) {
    console.log('✗ Failed to read module.json:', err.message);
    allPassed = false;
}

// Test autoload.json content
try {
    const autoloadJson = JSON.parse(fs.readFileSync('src/backend/Resources/autoload.json', 'utf8'));
    if (autoloadJson['psr-4'] && autoloadJson['psr-4'].hasOwnProperty('Espo\\Modules\\ViaCrm\\')) {
        console.log('✓ PSR-4 namespace configured');
    } else {
        console.log('✗ PSR-4 namespace not configured correctly');
        allPassed = false;
    }
} catch (err) {
    console.log('✗ Failed to read autoload.json:', err.message);
    allPassed = false;
}

// Test metadata structure
const metadataDirs = [
    'src/backend/Resources/metadata/entityDefs',
    'src/backend/Resources/metadata/scopes',
    'src/backend/Resources/metadata/clientDefs'
];

metadataDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✓ Metadata directory: ${dir}`);
    } else {
        console.log(`✗ MISSING: ${dir}`);
        allPassed = false;
    }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('✅ MODULE STRUCTURE VALIDATION PASSED');
    console.log('The module appears to be properly structured for EspoCRM');
} else {
    console.log('❌ MODULE STRUCTURE VALIDATION FAILED');
    console.log('Some required files or configurations are missing');
}
console.log('='.repeat(50));