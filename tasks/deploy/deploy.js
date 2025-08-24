import build from '../build/build.js';
import { DateTime, Interval } from 'luxon';
import { intro, outro, log, cancel } from '@clack/prompts';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

/**
 * Deploy via Docker - copy ZIP to container
 */
const dockerDeploy = async (zipPath, containerName) => {
    try {
        log.step(`Copying ${path.basename(zipPath)} to Docker container: ${containerName}`);
        
        // Get absolute path and convert WSL path to Windows path if needed
        let absoluteZipPath = path.resolve(zipPath);
        
        // Convert WSL path to Windows path for Docker
        if (absoluteZipPath.startsWith('/mnt/')) {
            // Convert /mnt/d/path to D:/path for Docker on Windows
            absoluteZipPath = absoluteZipPath.replace(/^\/mnt\/([a-z])/, (match, drive) => `${drive.toUpperCase()}:`);
            absoluteZipPath = absoluteZipPath.replace(/\//g, '\\');
        }
        
        // First create the directory in container
        try {
            await execAsync(`docker exec ${containerName} mkdir -p /var/www/html/data/upload/extensions`);
        } catch (e) {
            // Directory might already exist, continue
        }
        
        // Copy ZIP file to container's extensions directory
        await execAsync(`docker cp "${absoluteZipPath}" ${containerName}:/var/www/html/data/upload/extensions/`);
        
        log.success('ZIP file copied to container successfully');
        log.info('You can now install the extension via Administration → Extensions in EspoCRM');
        
        return true;
    } catch (error) {
        log.error(`Docker deploy failed: ${error.message}`);
        return false;
    }
};

/**
 * Deploy via HTTP API (future implementation)
 */
const httpDeploy = async (zipPath, url, username, password) => {
    log.warn('HTTP deploy not implemented yet');
    log.info('Using Docker deploy instead');
    return false;
};

/**
 * Deploy locally - copy files directly
 */
const localDeploy = async (zipPath, espoPath) => {
    try {
        log.step(`Copying ${path.basename(zipPath)} to EspoCRM: ${espoPath}`);
        
        const targetPath = path.join(espoPath, path.basename(zipPath));
        await fs.copy(zipPath, targetPath);
        
        log.success('Extension copied to EspoCRM directory');
        log.info('You can now install the extension via Administration → Extensions in EspoCRM');
        
        return true;
    } catch (error) {
        log.error(`Local deploy failed: ${error.message}`);
        return false;
    }
};

/**
 * Main deploy function
 */
const deploy = async () => {
    const START_DATE = DateTime.now();
    
    intro('🚀 Building & Deploying VIA CRM Module');
    
    try {
        // Build the extension first
        const zipPath = await build();
        
        if (!zipPath || !await fs.pathExists(zipPath)) {
            cancel('Build failed - no ZIP file created');
            return;
        }
        
        log.step('Starting deployment...');
        
        const deployMethod = process.env.DEPLOY_METHOD || 'docker';
        let deploySuccess = false;
        
        switch (deployMethod) {
            case 'docker':
                const containerName = process.env.DOCKER_CONTAINER || 'espocrm-app';
                deploySuccess = await dockerDeploy(zipPath, containerName);
                break;
                
            case 'http':
                const url = process.env.ESPO_URL || 'http://localhost:8080';
                const username = process.env.ESPO_USERNAME || 'admin';
                const password = process.env.ESPO_PASSWORD || 'admin';
                deploySuccess = await httpDeploy(zipPath, url, username, password);
                break;
                
            case 'local':
                const espoPath = process.env.ESPO_PATH;
                if (!espoPath) {
                    cancel('ESPO_PATH not set in .env file');
                    return;
                }
                deploySuccess = await localDeploy(zipPath, espoPath);
                break;
                
            default:
                cancel(`Unknown deploy method: ${deployMethod}`);
                return;
        }
        
        if (!deploySuccess) {
            cancel('Deploy failed');
            return;
        }
        
        const END_DATE = DateTime.now();
        const DEPLOY_TIME = Interval.fromDateTimes(START_DATE, END_DATE).toDuration('seconds');
        
        outro(`✅ Deploy completed in ${DEPLOY_TIME.toMillis()}ms`);
        
    } catch (error) {
        cancel(`Deploy failed: ${error.message}`);
    }
};

export default deploy;