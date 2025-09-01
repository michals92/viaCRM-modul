#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function createZip() {
    try {
        const buildDir = path.join(rootDir, 'build');
        const distDir = path.join(rootDir, 'dist');
        
        // Ensure dist directory exists
        await fs.ensureDir(distDir);
        
        // Read package.json for naming
        const packageJson = await fs.readJSON(path.join(rootDir, 'package.json'));
        const moduleName = packageJson.espocrm?.extensionName || packageJson.name;
        const version = packageJson.version;
        
        const zipName = `${moduleName}-${version}.zip`;
        const zipPath = path.join(distDir, zipName);
        
        console.log('📦 Creating extension zip...');
        
        // Create zip
        const zip = new AdmZip();
        
        // Add all files from build directory
        if (await fs.pathExists(buildDir)) {
            const addDirectoryToZip = async (dir, zipPath = '') => {
                const items = await fs.readdir(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const zipItemPath = zipPath ? path.join(zipPath, item) : item;
                    
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        await addDirectoryToZip(fullPath, zipItemPath);
                    } else {
                        const content = await fs.readFile(fullPath);
                        zip.addFile(zipItemPath, content);
                    }
                }
            };
            
            await addDirectoryToZip(buildDir);
        }
        
        // Write zip file
        zip.writeZip(zipPath);
        
        console.log(`✅ Extension zip created: ${zipPath}`);
        
        const stats = await fs.stat(zipPath);
        console.log(`📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
        
    } catch (error) {
        console.error('❌ Zip creation failed:', error.message);
        process.exit(1);
    }
}

createZip();