#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Read package.json to get module info
const packageJson = await fs.readJSON(path.join(rootDir, 'package.json'));
const moduleName = packageJson.espocrm?.extensionName || packageJson.name;
const moduleNamePascal = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
const moduleNameLower = moduleName.toLowerCase();

console.log(`🔨 Starting ${moduleName} module build...`);

async function build() {
    try {
        // Read package.json to get module info
        const packageJson = await fs.readJSON(path.join(rootDir, 'package.json'));
        const moduleName = packageJson.espocrm?.extensionName || packageJson.name;
        const moduleNamePascal = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const moduleNameLower = moduleName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Ensure build directory exists
        const buildDir = path.join(rootDir, 'build');
        await fs.ensureDir(buildDir);
        
        // Copy backend files
        console.log('📦 Copying backend files...');
        const backendSrc = path.join(rootDir, 'src/backend');
        const backendDest = path.join(buildDir, 'files/application/Espo/Modules', moduleNamePascal);
        
        if (await fs.pathExists(backendSrc)) {
            await fs.copy(backendSrc, backendDest);
        }
        
        // Copy client files
        console.log('📦 Copying client files...');
        const clientSrc = path.join(rootDir, 'src/client');
        const clientDest = path.join(buildDir, 'files/client/custom/modules', moduleNameLower);
        
        if (await fs.pathExists(clientSrc)) {
            await fs.copy(clientSrc, clientDest);
        }
        
        // Copy custom files for entity extensions
        console.log('📦 Copying custom files...');
        const customSrc = path.join(rootDir, 'src/custom');
        const customDest = path.join(buildDir, 'files/custom');
        
        if (await fs.pathExists(customSrc)) {
            await fs.copy(customSrc, customDest);
        }
        
        // Check for optional compile step
        const compileScriptPath = path.join(__dirname, 'compile-theme.js');
        if (await fs.pathExists(compileScriptPath)) {
            console.log('🎨 Running compilation step...');
            try {
                const compiler = await import('./compile-theme.js');
                await compiler.default?.() || compiler.compile?.();
                console.log('✅ Compilation completed successfully!');
            } catch (error) {
                console.warn('⚠️  Compilation step failed:', error.message);
                console.warn('   Continuing without compilation...');
            }
        }
        
        // Create manifest.json
        console.log('📄 Creating manifest...');
        
        const manifest = {
            name: moduleName,
            version: packageJson.version,
            acceptableVersions: [`>=${packageJson.espocrm?.espocrmVersion || '8.0.0'}`],
            php: [`>=${packageJson.espocrm?.phpVersion || '8.0'}`],
            releaseDate: new Date().toISOString().split('T')[0],
            author: packageJson.author,
            description: packageJson.description,
            tags: packageJson.keywords || []
        };
        
        await fs.writeJSON(path.join(buildDir, 'manifest.json'), manifest, { spaces: 2 });
        
        // Create extension info
        console.log('📄 Creating extension info...');
        const resourcesDir = path.join(buildDir, 'files/application/Espo/Modules', moduleNamePascal, 'Resources');
        await fs.ensureDir(resourcesDir);
        await fs.writeFile(
            path.join(resourcesDir, 'module.json'),
            JSON.stringify({
                order: 20,
                name: manifest.name,
                version: manifest.version
            }, null, 2)
        );
        
        console.log('✅ Build completed successfully!');
        console.log(`📁 Build output: ${buildDir}`);
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

build();